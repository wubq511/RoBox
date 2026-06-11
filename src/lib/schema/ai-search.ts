import { z } from "zod";

import type { ItemType } from "./items";

export const aiSearchSelectedTypeSchema = z.enum([
  "auto",
  "prompt",
  "skill",
  "tool",
]);

export const aiSearchRequestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  type: aiSearchSelectedTypeSchema.default("auto"),
});

export type AiSearchSelectedType = z.infer<typeof aiSearchSelectedTypeSchema>;
export type AiSearchRequest = z.infer<typeof aiSearchRequestSchema>;

export type AiSearchResultItem = {
  id: string;
  type: ItemType;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  sourceUrl: string;
  isFavorite: boolean;
  isAnalyzed: boolean;
  usageCount: number;
  updatedAt: string;
  contentPreview: string;
};

export type AiSearchResult = {
  item: AiSearchResultItem;
  score: number;
  reason: string;
  useCase: string;
};

export type AiSearchGroup = {
  type: ItemType;
  results: AiSearchResult[];
};

export type AiSearchResponse = {
  query: string;
  selectedType: AiSearchSelectedType;
  inferredTypes: ItemType[];
  scannedCount: number;
  candidateLimitReached: boolean;
  groups: AiSearchGroup[];
};
