import { DEFAULT_CATEGORIES, type ItemType } from "@/lib/schema/items";
import { getServerSupabaseClient } from "@/lib/supabase/server-client";

import { mapUserCategoryRow } from "./mappers";
import type { StoredUserCategory, UserCategoryRow } from "./types";

export async function getUserCategories(
  userId: string,
  type: ItemType,
): Promise<StoredUserCategory[]> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_categories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as UserCategoryRow[]).map(mapUserCategoryRow);
}

export async function getUserCategoryNames(
  userId: string,
  type: ItemType,
): Promise<string[]> {
  const categories = await getUserCategories(userId, type);
  return categories.map((c) => c.name);
}

export async function ensureDefaultCategories(
  userId: string,
): Promise<void> {
  const supabase = await getServerSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("user_categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (selectError) {
    throw selectError;
  }

  if (existing && existing.length > 0) {
    return;
  }

  const types: ItemType[] = ["prompt", "skill"];
  const rows = types.flatMap((type) =>
    DEFAULT_CATEGORIES.map((name, index) => ({
      user_id: userId,
      type,
      name,
      sort_order: index,
    })),
  );

  const { error: insertError } = await supabase
    .from("user_categories")
    .insert(rows);

  if (insertError) {
    throw insertError;
  }
}

export async function createUserCategory(
  userId: string,
  type: ItemType,
  name: string,
): Promise<StoredUserCategory> {
  const supabase = await getServerSupabaseClient();

  const { data: maxResult, error: maxError } = await supabase
    .from("user_categories")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("type", type)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (maxError) {
    throw maxError;
  }

  const nextSortOrder =
    maxResult && maxResult.length > 0 ? maxResult[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("user_categories")
    .insert({
      user_id: userId,
      type,
      name,
      sort_order: nextSortOrder,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapUserCategoryRow(data as UserCategoryRow);
}

export async function deleteUserCategory(
  userId: string,
  type: ItemType,
  name: string,
): Promise<{ deleted: boolean; usageCount: number }> {
  const usageCount = await getCategoryUsageCount(userId, type, name);

  if (usageCount > 0) {
    return { deleted: false, usageCount };
  }

  const supabase = await getServerSupabaseClient();

  const { error } = await supabase
    .from("user_categories")
    .delete()
    .eq("user_id", userId)
    .eq("type", type)
    .eq("name", name);

  if (error) {
    throw error;
  }

  return { deleted: true, usageCount: 0 };
}

export async function forceDeleteUserCategory(
  userId: string,
  type: ItemType,
  name: string,
  replacementCategory: string,
): Promise<void> {
  const supabase = await getServerSupabaseClient();

  const { error: updateError } = await supabase
    .from("items")
    .update({ category: replacementCategory })
    .eq("user_id", userId)
    .eq("type", type)
    .eq("category", name);

  if (updateError) {
    throw updateError;
  }

  const { error: deleteError } = await supabase
    .from("user_categories")
    .delete()
    .eq("user_id", userId)
    .eq("type", type)
    .eq("name", name);

  if (deleteError) {
    throw deleteError;
  }
}

export async function getCategoryUsageCount(
  userId: string,
  type: ItemType,
  name: string,
): Promise<number> {
  const supabase = await getServerSupabaseClient();

  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .eq("category", name);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function reorderUserCategories(
  userId: string,
  type: ItemType,
  orderedNames: string[],
): Promise<void> {
  const supabase = await getServerSupabaseClient();

  const updates = orderedNames.map((name, index) =>
    supabase
      .from("user_categories")
      .update({ sort_order: index })
      .eq("user_id", userId)
      .eq("type", type)
      .eq("name", name),
  );

  const results = await Promise.all(updates);

  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
  }
}

export async function validateCategoryBelongsToUser(
  userId: string,
  type: ItemType,
  category: string,
): Promise<boolean> {
  const supabase = await getServerSupabaseClient();

  const { data, error } = await supabase
    .from("user_categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("name", category)
    .limit(1);

  if (error) {
    throw error;
  }

  return data !== null && data.length > 0;
}
