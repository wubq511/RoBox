import type { SupabaseClient } from "@supabase/supabase-js";

import {
  copyActionSchema,
  createItemInputSchema,
  listItemsFiltersSchema,
  promptVariableSchema,
  updateItemInputSchema,
  type CopyAction,
  type CreateItemInput,
  type ListItemsFilters,
  type PromptVariableInput,
  type UpdateItemInput,
} from "@/lib/schema/items";
import { getServerSupabaseClient } from "@/lib/supabase/server-client";
import { requireAppUser } from "@/server/auth/session";

import { mapItemRow, mapPromptVariableRow } from "./mappers";
import type {
  ItemDetail,
  ItemRow,
  PromptVariableRow,
  StoredItem,
  StoredPromptVariable,
} from "./types";

type ItemInsertPayload = {
  user_id: string;
  type: CreateItemInput["type"];
  title: string;
  summary: string;
  content: string;
  category: CreateItemInput["category"];
  tags: string[];
  source_url: string | null;
};

type ItemUpdatePayload = Partial<{
  title: string;
  summary: string;
  content: string;
  category: UpdateItemInput["category"];
  tags: string[];
  source_url: string | null;
  is_favorite: boolean;
  is_analyzed: boolean;
}>;

function sanitizeSearchValue(value: string) {
  return value.replaceAll(",", " ").replaceAll("*", " ").trim();
}

async function getDatabaseContext(nextPath = "/dashboard") {
  const [supabase, user] = await Promise.all([
    getServerSupabaseClient(),
    requireAppUser(nextPath),
  ]);

  return {
    supabase,
    userId: user.id,
  };
}

export function buildItemInsert(
  userId: string,
  input: CreateItemInput,
): ItemInsertPayload {
  const parsed = createItemInputSchema.parse(input);

  return {
    user_id: userId,
    type: parsed.type,
    title: parsed.title ?? "",
    summary: parsed.summary ?? "",
    content: parsed.content,
    category: parsed.category,
    tags: parsed.tags,
    source_url: parsed.sourceUrl || null,
  };
}

export function buildItemUpdate(input: UpdateItemInput): ItemUpdatePayload {
  const parsed = updateItemInputSchema.parse(input);
  const payload: ItemUpdatePayload = {};

  if (parsed.title !== undefined) {
    payload.title = parsed.title;
  }

  if (parsed.summary !== undefined) {
    payload.summary = parsed.summary;
  }

  if (parsed.content !== undefined) {
    payload.content = parsed.content;
  }

  if (parsed.category !== undefined) {
    payload.category = parsed.category;
  }

  if (parsed.tags !== undefined) {
    payload.tags = parsed.tags;
  }

  if (parsed.sourceUrl !== undefined) {
    payload.source_url = parsed.sourceUrl || null;
  }

  if (parsed.isFavorite !== undefined) {
    payload.is_favorite = parsed.isFavorite;
  }

  if (parsed.isAnalyzed !== undefined) {
    payload.is_analyzed = parsed.isAnalyzed;
  }

  return payload;
}

export function sanitizeListItemsInput(input: Partial<ListItemsFilters> = {}) {
  return listItemsFiltersSchema.parse({
    ...input,
    search: input.search?.trim() || undefined,
  });
}

async function selectPromptVariables(
  supabase: SupabaseClient,
  itemId: string,
): Promise<StoredPromptVariable[]> {
  const { data, error } = await supabase
    .from("prompt_variables")
    .select("*")
    .eq("item_id", itemId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PromptVariableRow[]).map(mapPromptVariableRow);
}

export async function listItems(filters: Partial<ListItemsFilters> = {}) {
  const parsed = sanitizeListItemsInput(filters);
  const { supabase, userId } = await getDatabaseContext(
    parsed.type === "skill" ? "/skills" : "/dashboard",
  );

  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(parsed.limit);

  if (parsed.type) {
    query = query.eq("type", parsed.type);
  }

  if (parsed.category) {
    query = query.eq("category", parsed.category);
  }

  if (parsed.isFavorite !== undefined) {
    query = query.eq("is_favorite", parsed.isFavorite);
  }

  if (parsed.search) {
    const search = sanitizeSearchValue(parsed.search);

    if (search) {
      query = query.or(
        `title.ilike.*${search}*,summary.ilike.*${search}*,content.ilike.*${search}*`,
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as ItemRow[]).map(mapItemRow);
}

export async function getItemById(itemId: string): Promise<StoredItem | null> {
  const { supabase, userId } = await getDatabaseContext();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapItemRow(data as ItemRow);
}

export async function getItemDetail(itemId: string): Promise<ItemDetail | null> {
  const { supabase } = await getDatabaseContext();
  const item = await getItemById(itemId);

  if (!item) {
    return null;
  }

  const variables =
    item.type === "prompt" ? await selectPromptVariables(supabase, item.id) : [];

  return {
    ...item,
    variables,
  };
}

export async function createItem(input: CreateItemInput) {
  const { supabase, userId } = await getDatabaseContext();
  const payload = buildItemInsert(userId, input);
  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapItemRow(data as ItemRow);
}

export async function updateItem(itemId: string, input: UpdateItemInput) {
  const { supabase, userId } = await getDatabaseContext();
  const payload = buildItemUpdate(input);

  if (Object.keys(payload).length === 0) {
    return getItemById(itemId);
  }

  const { data, error } = await supabase
    .from("items")
    .update(payload)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapItemRow(data as ItemRow) : null;
}

export async function replacePromptVariables(
  itemId: string,
  variables: PromptVariableInput[],
) {
  const { supabase } = await getDatabaseContext();
  const parsedVariables = variables.map((variable) =>
    promptVariableSchema.parse(variable),
  );

  const { error: deleteError } = await supabase
    .from("prompt_variables")
    .delete()
    .eq("item_id", itemId);

  if (deleteError) {
    throw deleteError;
  }

  if (parsedVariables.length === 0) {
    return [] satisfies StoredPromptVariable[];
  }

  const { data, error } = await supabase
    .from("prompt_variables")
    .insert(
      parsedVariables.map((variable, index) => ({
        item_id: itemId,
        name: variable.name,
        description: variable.description,
        default_value: variable.defaultValue,
        required: variable.required,
        sort_order: variable.sortOrder ?? index,
      })),
    )
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PromptVariableRow[]).map(mapPromptVariableRow);
}

export async function toggleFavorite(itemId: string) {
  const current = await getItemById(itemId);

  if (!current) {
    return null;
  }

  return updateItem(itemId, {
    isFavorite: !current.isFavorite,
  });
}

export async function recordCopyAction(itemId: string, action: CopyAction) {
  const parsedAction = copyActionSchema.parse(action);
  const { supabase, userId } = await getDatabaseContext();

  const { data: currentRow, error: currentError } = await supabase
    .from("items")
    .select("id, usage_count")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!currentRow) {
    return null;
  }

  const { error: logError } = await supabase.from("usage_logs").insert({
    item_id: itemId,
    action: parsedAction,
  });

  if (logError) {
    throw logError;
  }

  const { data, error } = await supabase
    .from("items")
    .update({
      usage_count: Number(currentRow.usage_count ?? 0) + 1,
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapItemRow(data as ItemRow) : null;
}
