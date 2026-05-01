import {
  itemCategories,
  type CopyAction,
  type ItemCategory,
  type ItemType,
  type PromptVariableInput,
} from "@/lib/schema/items";

export { itemCategories };
export type { CopyAction, ItemCategory, ItemType };

export type PromptVariable = Omit<PromptVariableInput, "sortOrder">;

export interface LibraryItem {
  id: string;
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
  updatedAt: string;
  variables: PromptVariable[];
}
