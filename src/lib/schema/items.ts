import { z } from "zod";

export const itemTypeSchema = z.enum(["prompt", "skill"]);
export const itemTypes = [...itemTypeSchema.options];

export const itemCategorySchema = z.enum([
  "Writing",
  "Coding",
  "Research",
  "Design",
  "Study",
  "Agent",
  "Content",
  "Other",
]);
export const itemCategories = [...itemCategorySchema.options];

export const copyActionSchema = z.enum(["copy_raw", "copy_final"]);
export const copyActions = [...copyActionSchema.options];

export const itemSortSchema = z.enum(["recent", "used"]);
export const itemSorts = [...itemSortSchema.options];

export const promptVariableSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().default(""),
  defaultValue: z.string().default(""),
  required: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const createItemInputSchema = z.object({
  type: itemTypeSchema,
  title: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(240).optional(),
  content: z.string().trim().min(1),
  category: itemCategorySchema.default("Other"),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  sourceUrl: z.url().optional().or(z.literal("")),
});

export const updateItemInputSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  summary: z.string().trim().max(240).optional(),
  content: z.string().trim().min(1).optional(),
  category: itemCategorySchema.optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  sourceUrl: z.url().optional().or(z.literal("")),
  isFavorite: z.boolean().optional(),
  isAnalyzed: z.boolean().optional(),
});

export const itemEditorInputSchema = z.object({
  type: itemTypeSchema,
  title: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(240).optional(),
  content: z.string().trim().min(1),
  category: itemCategorySchema.default("Other"),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  sourceUrl: z.url().optional().or(z.literal("")),
  variables: z.array(promptVariableSchema).default([]),
});

export const listItemsFiltersSchema = z.object({
  type: itemTypeSchema.optional(),
  category: itemCategorySchema.optional(),
  tag: z.string().trim().min(1).max(32).optional(),
  isFavorite: z.boolean().optional(),
  search: z.string().trim().max(120).optional(),
  sort: itemSortSchema.default("recent"),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ItemType = z.infer<typeof itemTypeSchema>;
export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type CopyAction = z.infer<typeof copyActionSchema>;
export type ItemSort = z.infer<typeof itemSortSchema>;
export type PromptVariableInput = z.input<typeof promptVariableSchema>;
export type CreateItemInput = z.input<typeof createItemInputSchema>;
export type UpdateItemInput = z.input<typeof updateItemInputSchema>;
export type ItemEditorInput = z.input<typeof itemEditorInputSchema>;
export type ListItemsFilters = z.input<typeof listItemsFiltersSchema>;
