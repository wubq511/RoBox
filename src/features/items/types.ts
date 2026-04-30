export const itemCategories = [
  "Writing",
  "Coding",
  "Research",
  "Design",
  "Study",
  "Agent",
  "Content",
  "Other",
] as const;

export type ItemCategory = (typeof itemCategories)[number];
export type ItemType = "prompt" | "skill";

export interface PromptVariable {
  name: string;
  description: string;
  defaultValue: string;
  required: boolean;
}

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
