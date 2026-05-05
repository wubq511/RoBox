import type {
  ItemRow,
  PromptVariableRow,
  StoredItem,
  StoredPromptVariable,
  StoredUserCategory,
  UserCategoryRow,
} from "./types";

export function mapItemRow(row: ItemRow): StoredItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    tags: row.tags,
    sourceUrl: row.source_url ?? "",
    isFavorite: row.is_favorite,
    isAnalyzed: row.is_analyzed,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPromptVariableRow(
  row: PromptVariableRow,
): StoredPromptVariable {
  return {
    id: row.id,
    itemId: row.item_id,
    name: row.name,
    description: row.description,
    defaultValue: row.default_value,
    required: row.required,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function mapUserCategoryRow(row: UserCategoryRow): StoredUserCategory {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
