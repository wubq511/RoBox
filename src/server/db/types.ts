import type {
  ItemCategory,
  ItemType,
  PromptVariableInput,
} from "@/lib/schema/items";

export interface ItemRow {
  id: string;
  user_id: string;
  type: ItemType;
  title: string;
  summary: string;
  content: string;
  category: ItemCategory;
  tags: string[];
  source_url: string | null;
  is_favorite: boolean;
  is_analyzed: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptVariableRow {
  id: string;
  item_id: string;
  name: string;
  description: string;
  default_value: string;
  required: boolean;
  sort_order: number;
  created_at: string;
}

export interface UsageLogRow {
  id: string;
  item_id: string;
  action: "copy_raw" | "copy_final";
  created_at: string;
}

export interface StoredPromptVariable extends PromptVariableInput {
  id: string;
  itemId: string;
  createdAt: string;
}

export interface StoredItem {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  summary: string;
  content: string;
  category: ItemCategory;
  tags: string[];
  sourceUrl: string;
  isFavorite: boolean;
  isAnalyzed: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDetail extends StoredItem {
  variables: StoredPromptVariable[];
}

export interface DashboardCounts {
  total: number;
  prompts: number;
  skills: number;
  pending: number;
}

export interface DashboardSnapshot {
  counts: DashboardCounts;
  favorites: StoredItem[];
  pending: StoredItem[];
  recent: StoredItem[];
}
