import type { SupabaseClient } from "@supabase/supabase-js";

import {
  copyActionSchema,
  createItemInputSchema,
  listItemsFiltersSchema,
  promptVariableSchema,
  updateItemInputSchema,
  type CopyAction,
  type CreateItemInput,
  type ItemType,
  type ListItemsFilters,
  type PromptVariableInput,
  type UpdateItemInput,
} from "@/lib/schema/items";
import { getServerSupabaseClient } from "@/lib/supabase/server-client";
import { requireAppUser } from "@/server/auth/session";
import {
  ensureDefaultCategories,
  validateCategoryBelongsToUser,
} from "@/server/db/categories";

import { mapItemRow, mapPromptVariableRow } from "./mappers";
import type {
  DashboardCounts,
  DashboardSnapshot,
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
  category: string;
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

type DashboardSnapshotRpcPayload = {
  counts?: Partial<DashboardCounts>;
  favorites?: ItemRow[];
  pending?: ItemRow[];
  recent?: ItemRow[];
};

function sanitizeSearchValue(value: string) {
  return value
    .replaceAll(",", " ")
    .replaceAll("*", " ")
    .replace(/[(){}"]/g, " ")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .trim();
}

function compareIsoDatesDesc(left: string, right: string) {
  return right.localeCompare(left);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toDashboardSnapshot(payload: unknown): DashboardSnapshot {
  if (!isRecord(payload)) {
    throw new Error("Invalid dashboard snapshot payload.");
  }

  const data = payload as DashboardSnapshotRpcPayload;
  const counts = data.counts ?? {};
  const mapRows = (rows: ItemRow[] | undefined) =>
    (Array.isArray(rows) ? rows : []).map((row) => mapItemRow(row));

  return {
    counts: {
      total: counts.total ?? 0,
      prompts: counts.prompts ?? 0,
      skills: counts.skills ?? 0,
      tools: counts.tools ?? 0,
      pending: counts.pending ?? 0,
    },
    favorites: mapRows(data.favorites),
    pending: mapRows(data.pending),
    recent: mapRows(data.recent),
  };
}

type DatabaseContextOptions = {
  nextPath?: string;
  userId?: string;
};

async function getDatabaseContext(options: DatabaseContextOptions = {}) {
  const supabase = await getServerSupabaseClient();

  if (options.userId) {
    return {
      supabase,
      userId: options.userId,
    };
  }

  const user = await requireAppUser(options.nextPath ?? "/dashboard");

  return {
    supabase,
    userId: user.id,
  };
}

async function assertCategoryBelongsToUser(
  userId: string,
  type: ItemType,
  category: string,
) {
  await ensureDefaultCategories(userId);

  const isValidCategory = await validateCategoryBelongsToUser(
    userId,
    type,
    category,
  );

  if (!isValidCategory) {
    throw new Error("Invalid category.");
  }
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
    tag: input.tag?.trim() || undefined,
  });
}

export function sortItemsByRecentUsage<T extends Pick<StoredItem, "id" | "updatedAt">>(
  items: T[],
  copiedAtByItemId: Record<string, string>,
) {
  return [...items].sort((left, right) => {
    const leftTimestamp = copiedAtByItemId[left.id] ?? left.updatedAt;
    const rightTimestamp = copiedAtByItemId[right.id] ?? right.updatedAt;

    return compareIsoDatesDesc(leftTimestamp, rightTimestamp);
  });
}

async function selectLatestCopiedAtByItemId(
  supabase: SupabaseClient,
  itemIds: string[],
) {
  if (itemIds.length === 0) {
    return {} satisfies Record<string, string>;
  }

  const { data, error } = await supabase.rpc("get_latest_copied_at", {
    p_item_ids: itemIds,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ item_id: string; latest_copied_at: string }>).reduce<
    Record<string, string>
  >((accumulator, row) => {
    accumulator[row.item_id] = row.latest_copied_at;
    return accumulator;
  }, {});
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

export async function listItems(
  filters: Partial<ListItemsFilters> = {},
  options: { nextPath?: string; userId?: string } = {},
) {
  const parsed = sanitizeListItemsInput(filters);
  const nextPath =
    parsed.type === "skill"
      ? "/skills"
      : parsed.type === "tool"
        ? "/tools"
        : parsed.type === "prompt"
          ? "/prompts"
          : "/dashboard";
  const { supabase, userId } = await getDatabaseContext({
    nextPath: options.nextPath ?? nextPath,
    userId: options.userId,
  });

  let query = supabase.from("items").select("*").eq("user_id", userId);

  if (parsed.type) {
    query = query.eq("type", parsed.type);
  }

  if (parsed.category) {
    query = query.eq("category", parsed.category);
  }

  if (parsed.isFavorite !== undefined) {
    query = query.eq("is_favorite", parsed.isFavorite);
  }

  if (parsed.tag) {
    query = query.contains("tags", [parsed.tag]);
  }

  if (parsed.search) {
    const search = sanitizeSearchValue(parsed.search);

    if (search) {
      query = query.or(
        `title.ilike.*${search}*,summary.ilike.*${search}*,content.ilike.*${search}*`,
      );
    }
  }

  if (parsed.sort === "updated") {
    query = query.order("updated_at", { ascending: false }).limit(parsed.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const items = ((data ?? []) as ItemRow[]).map(mapItemRow);

  if (parsed.sort === "updated") {
    return items;
  }

  const copiedAtByItemId = await selectLatestCopiedAtByItemId(
    supabase,
    items.map((item) => item.id),
  );

  return sortItemsByRecentUsage(items, copiedAtByItemId).slice(0, parsed.limit);
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

  const item = mapItemRow(data as ItemRow);
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

  await assertCategoryBelongsToUser(userId, payload.type, payload.category);

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

  if (payload.category !== undefined) {
    const { data: existingItem, error: selectError } = await supabase
      .from("items")
      .select("type")
      .eq("id", itemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (!existingItem) {
      return null;
    }

    await assertCategoryBelongsToUser(
      userId,
      (existingItem as Pick<ItemRow, "type">).type,
      payload.category,
    );
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

export async function deleteItem(itemId: string) {
  const { supabase, userId } = await getDatabaseContext();
  const { data, error } = await supabase
    .from("items")
    .delete()
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

  const existingItem = await getItemById(itemId);

  if (!existingItem) {
    throw new Error("Item not found.");
  }

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
  const { supabase, userId } = await getDatabaseContext();

  const { data, error } = await supabase.rpc("toggle_favorite", {
    p_item_id: itemId,
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return mapItemRow(row as ItemRow);
}

export async function recordCopyAction(itemId: string, action: CopyAction) {
  const parsedAction = copyActionSchema.parse(action);
  const { supabase, userId } = await getDatabaseContext();

  const { data, error } = await supabase.rpc("increment_usage_count", {
    p_item_id: itemId,
    p_user_id: userId,
    p_action: parsedAction,
  });

  if (error) {
    throw error;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return mapItemRow(row as ItemRow);
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const { supabase, userId } = await getDatabaseContext();

  const { data, error } = await supabase.rpc("get_dashboard_snapshot", {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return toDashboardSnapshot(data);
}
