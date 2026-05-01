# Phase 3 Library MVP Implementation Plan

> Status: Archived on `2026-05-02`. Phase 3 shipped, merged into `main`, and passed full verification on the merged branch.
> This file is kept as a historical worker plan only. Use `D:\RoBox\PLAN.md`, `D:\RoBox\README.md`, and `D:\RoBox\docs\setup.md` for current project state.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock-driven workspace library with a real Supabase-backed Prompt / Skill MVP that completes the Phase 3 loop: save, search, open, edit, favorite, delete, and copy raw content.

**Architecture:** Keep all persistence behind `src/server/db/items.ts`, add server actions for mutations, and move pages to route-backed list/detail/edit flows. Reuse shared library components for Prompt and Skill, but isolate Prompt variable-definition editing so Phase 4 can later add `copy_final` without rewriting the Phase 3 shell.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Supabase SSR clients, Tailwind CSS, shadcn/ui primitives

---

### Task 1: Extend Phase 3 schemas and URL query helpers

**Files:**
- Modify: `src/lib/schema/items.ts`
- Test: `src/lib/schema/items.test.ts`
- Create: `src/features/items/query-state.ts`
- Test: `src/features/items/query-state.test.ts`

- [ ] **Step 1: Write the failing schema and query-state tests**

```ts
// src/lib/schema/items.test.ts
import { describe, expect, it } from "vitest";

import {
  copyActionSchema,
  createItemInputSchema,
  itemCategorySchema,
  itemEditorInputSchema,
  listItemsFiltersSchema,
} from "./items";

describe("item schemas", () => {
  it("accepts only phase 2 categories", () => {
    expect(itemCategorySchema.parse("Coding")).toBe("Coding");
    expect(() => itemCategorySchema.parse("Workflow")).toThrow();
  });

  it("requires raw content when creating an item", () => {
    expect(() =>
      createItemInputSchema.parse({ type: "prompt", content: "" }),
    ).toThrow();
  });

  it("accepts only supported copy actions", () => {
    expect(copyActionSchema.parse("copy_raw")).toBe("copy_raw");
    expect(() => copyActionSchema.parse("copy_preview")).toThrow();
  });

  it("supports tag filters and recent-use sorting", () => {
    expect(
      listItemsFiltersSchema.parse({
        type: "prompt",
        tag: "agent",
        sort: "used",
      }),
    ).toMatchObject({
      type: "prompt",
      tag: "agent",
      sort: "used",
      limit: 50,
    });
  });

  it("allows prompt editor input with zero variables", () => {
    expect(
      itemEditorInputSchema.parse({
        type: "prompt",
        title: "Prompt A",
        summary: "",
        content: "raw prompt",
        category: "Coding",
        tags: [],
        sourceUrl: "",
        variables: [],
      }).variables,
    ).toEqual([]);
  });
});
```

```ts
// src/features/items/query-state.test.ts
import { describe, expect, it } from "vitest";

import { buildLibraryHref, parseLibrarySearchParams } from "./query-state";

describe("library query state", () => {
  it("normalizes prompt list query params", () => {
    expect(
      parseLibrarySearchParams(
        {
          search: "  refactor prompt  ",
          category: "Coding",
          tag: "ts",
          favorite: "1",
          sort: "used",
        },
        "prompt",
      ),
    ).toMatchObject({
      type: "prompt",
      search: "refactor prompt",
      category: "Coding",
      tag: "ts",
      isFavorite: true,
      sort: "used",
    });
  });

  it("builds stable list hrefs without empty params", () => {
    expect(
      buildLibraryHref("skill", {
        search: "agent",
        sort: "updated",
      }),
    ).toBe("/skills?search=agent&sort=updated");
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail for the missing Phase 3 inputs**

Run:

```bash
npm run test -- src/lib/schema/items.test.ts src/features/items/query-state.test.ts
```

Expected:

```text
FAIL src/lib/schema/items.test.ts
FAIL src/features/items/query-state.test.ts
```

- [ ] **Step 3: Implement sort/tag/editor schemas and query-state helpers**

```ts
// src/lib/schema/items.ts
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

export const itemSortSchema = z.enum(["updated", "used"]);
export const itemSorts = [...itemSortSchema.options];

export const copyActionSchema = z.enum(["copy_raw", "copy_final"]);
export const copyActions = [...copyActionSchema.options];

export const promptVariableSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().default(""),
  defaultValue: z.string().default(""),
  required: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const itemEditorInputSchema = z.object({
  type: itemTypeSchema,
  title: z.string().trim().max(120).default(""),
  summary: z.string().trim().max(240).default(""),
  content: z.string().trim().min(1),
  category: itemCategorySchema.default("Other"),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  sourceUrl: z.url().optional().or(z.literal("")),
  variables: z.array(promptVariableSchema).max(20).default([]),
});

export const createItemInputSchema = itemEditorInputSchema.omit({
  variables: true,
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

export const listItemsFiltersSchema = z.object({
  type: itemTypeSchema.optional(),
  category: itemCategorySchema.optional(),
  tag: z.string().trim().min(1).max(32).optional(),
  isFavorite: z.boolean().optional(),
  search: z.string().trim().max(120).optional(),
  sort: itemSortSchema.default("updated"),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ItemType = z.infer<typeof itemTypeSchema>;
export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type ItemSort = z.infer<typeof itemSortSchema>;
export type CopyAction = z.infer<typeof copyActionSchema>;
export type PromptVariableInput = z.input<typeof promptVariableSchema>;
export type ItemEditorInput = z.input<typeof itemEditorInputSchema>;
export type CreateItemInput = z.input<typeof createItemInputSchema>;
export type UpdateItemInput = z.input<typeof updateItemInputSchema>;
export type ListItemsFilters = z.input<typeof listItemsFiltersSchema>;
```

```ts
// src/features/items/query-state.ts
import type { ItemType, ListItemsFilters } from "@/lib/schema/items";
import { sanitizeListItemsInput } from "@/server/db/items";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLibrarySearchParams(
  input: Record<string, string | string[] | undefined>,
  type: ItemType,
): ListItemsFilters {
  return sanitizeListItemsInput({
    type,
    search: firstValue(input.search),
    category: firstValue(input.category),
    tag: firstValue(input.tag),
    isFavorite: firstValue(input.favorite) === "1" ? true : undefined,
    sort: firstValue(input.sort),
  });
}

export function buildLibraryHref(
  type: ItemType,
  filters: Partial<ListItemsFilters>,
) {
  const basePath = type === "prompt" ? "/prompts" : "/skills";
  const searchParams = new URLSearchParams();

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.category) searchParams.set("category", filters.category);
  if (filters.tag) searchParams.set("tag", filters.tag);
  if (filters.isFavorite) searchParams.set("favorite", "1");
  if (filters.sort) searchParams.set("sort", filters.sort);

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}
```

- [ ] **Step 4: Run the tests again to verify the shared parsing layer passes**

Run:

```bash
npm run test -- src/lib/schema/items.test.ts src/features/items/query-state.test.ts
```

Expected:

```text
PASS src/lib/schema/items.test.ts
PASS src/features/items/query-state.test.ts
```

- [ ] **Step 5: Commit the schema/query-state base**

```bash
git add src/lib/schema/items.ts src/lib/schema/items.test.ts src/features/items/query-state.ts src/features/items/query-state.test.ts
git commit -m "feat: add phase 3 item query schemas"
```

### Task 2: Extend repository helpers for sorting, tag filters, dashboard data, and delete

**Files:**
- Modify: `src/server/db/types.ts`
- Modify: `src/server/db/items.ts`
- Test: `src/server/db/items.test.ts`

- [ ] **Step 1: Write the failing repository helper tests**

```ts
// src/server/db/items.test.ts
import { describe, expect, it } from "vitest";

import {
  buildDashboardCounts,
  buildItemInsert,
  buildItemUpdate,
  sanitizeListItemsInput,
  sortItemsByRecentUsage,
} from "./items";

describe("item repository helpers", () => {
  it("defaults missing category to Other", () => {
    expect(
      buildItemInsert("user-1", {
        type: "prompt",
        content: "raw prompt",
        tags: [],
      }).category,
    ).toBe("Other");
  });

  it("does not send undefined fields in updates", () => {
    expect(buildItemUpdate({ title: "New title", summary: undefined })).toEqual({
      title: "New title",
    });
  });

  it("normalizes list filters", () => {
    expect(
      sanitizeListItemsInput({
        search: "  prompt  ",
        tag: "agent",
        sort: "used",
      }),
    ).toMatchObject({
      search: "prompt",
      tag: "agent",
      sort: "used",
      limit: 50,
    });
  });

  it("sorts by latest copy timestamp before updatedAt", () => {
    const sorted = sortItemsByRecentUsage(
      [
        {
          id: "item-a",
          userId: "user-1",
          type: "prompt",
          title: "Prompt A",
          summary: "",
          content: "raw",
          category: "Coding",
          tags: [],
          sourceUrl: "",
          isFavorite: false,
          isAnalyzed: false,
          usageCount: 0,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
        {
          id: "item-b",
          userId: "user-1",
          type: "skill",
          title: "Skill B",
          summary: "",
          content: "raw",
          category: "Agent",
          tags: [],
          sourceUrl: "",
          isFavorite: false,
          isAnalyzed: true,
          usageCount: 0,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-02T00:00:00.000Z",
        },
      ],
      {
        "item-a": "2026-05-03T12:00:00.000Z",
      },
    );

    expect(sorted.map((item) => item.id)).toEqual(["item-a", "item-b"]);
  });

  it("builds dashboard counts from stored items", () => {
    expect(
      buildDashboardCounts([
        { type: "prompt", isAnalyzed: false },
        { type: "skill", isAnalyzed: true },
        { type: "prompt", isAnalyzed: false },
      ]),
    ).toEqual({
      total: 3,
      prompts: 2,
      skills: 1,
      pending: 2,
    });
  });
});
```

- [ ] **Step 2: Run the repository helper tests to verify the Phase 3 helpers are missing**

Run:

```bash
npm run test -- src/server/db/items.test.ts
```

Expected:

```text
FAIL src/server/db/items.test.ts
```

- [ ] **Step 3: Implement dashboard types, delete support, and usage-based sorting**

```ts
// src/server/db/types.ts
import type {
  ItemCategory,
  ItemSort,
  ItemType,
  PromptVariableInput,
} from "@/lib/schema/items";

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
```

```ts
// src/server/db/items.ts
import type { DashboardCounts, DashboardSnapshot, ItemDetail, ItemRow, PromptVariableRow, StoredItem, StoredPromptVariable } from "./types";

export function sortItemsByRecentUsage(
  items: StoredItem[],
  copiedAtByItemId: Record<string, string>,
) {
  return [...items].sort((left, right) => {
    const leftCopiedAt = copiedAtByItemId[left.id];
    const rightCopiedAt = copiedAtByItemId[right.id];

    if (leftCopiedAt && rightCopiedAt && leftCopiedAt !== rightCopiedAt) {
      return rightCopiedAt.localeCompare(leftCopiedAt);
    }

    if (leftCopiedAt && !rightCopiedAt) return -1;
    if (!leftCopiedAt && rightCopiedAt) return 1;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function buildDashboardCounts(
  items: Array<Pick<StoredItem, "type" | "isAnalyzed">>,
): DashboardCounts {
  return {
    total: items.length,
    prompts: items.filter((item) => item.type === "prompt").length,
    skills: items.filter((item) => item.type === "skill").length,
    pending: items.filter((item) => !item.isAnalyzed).length,
  };
}

async function listRecentUsageMap(supabase: SupabaseClient, itemIds: string[]) {
  if (itemIds.length === 0) {
    return {} as Record<string, string>;
  }

  const { data, error } = await supabase
    .from("usage_logs")
    .select("item_id, created_at")
    .in("item_id", itemIds)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, string>>((accumulator, row) => {
    if (!accumulator[row.item_id]) {
      accumulator[row.item_id] = row.created_at;
    }
    return accumulator;
  }, {});
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

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const updatedItems = await listItems({ sort: "updated", limit: 100 });
  const recentUsageMap = await (async () => {
    const { supabase } = await getDatabaseContext();
    return listRecentUsageMap(
      supabase,
      updatedItems.map((item) => item.id),
    );
  })();

  return {
    counts: buildDashboardCounts(updatedItems),
    favorites: updatedItems.filter((item) => item.isFavorite).slice(0, 3),
    pending: updatedItems.filter((item) => !item.isAnalyzed).slice(0, 4),
    recent: sortItemsByRecentUsage(updatedItems, recentUsageMap).slice(0, 4),
  };
}
```

- [ ] **Step 4: Update `listItems` to support `tag` and `sort`**

```ts
// inside listItems in src/server/db/items.ts
if (parsed.tag) {
  query = query.contains("tags", [parsed.tag]);
}

const { data, error } = await query;

if (error) {
  throw error;
}

const items = ((data ?? []) as ItemRow[]).map(mapItemRow);

if (parsed.sort === "used") {
  const recentUsageMap = await listRecentUsageMap(
    supabase,
    items.map((item) => item.id),
  );

  return sortItemsByRecentUsage(items, recentUsageMap);
}

return items;
```

- [ ] **Step 5: Run the repository test file again**

Run:

```bash
npm run test -- src/server/db/items.test.ts
```

Expected:

```text
PASS src/server/db/items.test.ts
```

- [ ] **Step 6: Commit the repository layer**

```bash
git add src/server/db/types.ts src/server/db/items.ts src/server/db/items.test.ts
git commit -m "feat: extend item repository for phase 3 library"
```

### Task 3: Add Phase 3 item form parsing and mutation server actions

**Files:**
- Create: `src/server/items/forms.ts`
- Test: `src/server/items/forms.test.ts`
- Create: `src/server/items/actions.ts`
- Test: `src/server/items/actions.test.ts`

- [ ] **Step 1: Write failing tests for form parsing and mutation wiring**

```ts
// src/server/items/forms.test.ts
import { describe, expect, it } from "vitest";

import { parseItemFormData, parseTagsInput, parseVariablesInput } from "./forms";

describe("item form parsing", () => {
  it("splits tags from comma-separated input", () => {
    expect(parseTagsInput("ts,  agent, ts , ")).toEqual(["ts", "agent"]);
  });

  it("treats empty variables as an empty prompt variable list", () => {
    expect(parseVariablesInput("")).toEqual([]);
  });

  it("parses prompt form data into editor input", () => {
    const formData = new FormData();
    formData.set("title", "Prompt A");
    formData.set("summary", "Summary");
    formData.set("content", "raw prompt");
    formData.set("category", "Coding");
    formData.set("tags", "ts, agent");
    formData.set(
      "variables",
      JSON.stringify([
        {
          name: "topic",
          description: "focus area",
          defaultValue: "TypeScript",
          required: true,
          sortOrder: 0,
        },
      ]),
    );

    expect(parseItemFormData(formData, "prompt")).toMatchObject({
      type: "prompt",
      tags: ["ts", "agent"],
      variables: [{ name: "topic", required: true }],
    });
  });
});
```

```ts
// src/server/items/actions.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  recordCopyAction: vi.fn(),
  replacePromptVariables: vi.fn(),
  toggleFavorite: vi.fn(),
  updateItem: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/db/items", () => ({
  createItem: mocks.createItem,
  deleteItem: mocks.deleteItem,
  recordCopyAction: mocks.recordCopyAction,
  replacePromptVariables: mocks.replacePromptVariables,
  toggleFavorite: mocks.toggleFavorite,
  updateItem: mocks.updateItem,
}));

import {
  createPromptAction,
  initialItemFormState,
  recordCopyActionAction,
} from "./actions";

describe("item actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a prompt and replaces its variables", async () => {
    mocks.createItem.mockResolvedValue({ id: "prompt-1" });
    mocks.replacePromptVariables.mockResolvedValue([]);

    const formData = new FormData();
    formData.set("title", "Prompt A");
    formData.set("summary", "Summary");
    formData.set("content", "raw prompt");
    formData.set("category", "Coding");
    formData.set("tags", "ts, agent");
    formData.set("variables", "[]");

    await createPromptAction(initialItemFormState, formData);

    expect(mocks.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "prompt",
        title: "Prompt A",
      }),
    );
    expect(mocks.replacePromptVariables).toHaveBeenCalledWith("prompt-1", []);
    expect(mocks.redirect).toHaveBeenCalledWith("/prompts/prompt-1");
  });

  it("records copy usage with copy_raw only for phase 3 buttons", async () => {
    await recordCopyActionAction({
      itemId: "item-1",
      action: "copy_raw",
      revalidatePaths: ["/prompts", "/dashboard"],
    });

    expect(mocks.recordCopyAction).toHaveBeenCalledWith("item-1", "copy_raw");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
```

- [ ] **Step 2: Run the new form/action tests to verify they fail**

Run:

```bash
npm run test -- src/server/items/forms.test.ts src/server/items/actions.test.ts
```

Expected:

```text
FAIL src/server/items/forms.test.ts
FAIL src/server/items/actions.test.ts
```

- [ ] **Step 3: Implement parsed form helpers**

```ts
// src/server/items/forms.ts
import type { ItemType, PromptVariableInput } from "@/lib/schema/items";
import { itemEditorInputSchema, promptVariableSchema } from "@/lib/schema/items";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseTagsInput(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

export function parseVariablesInput(value: string): PromptVariableInput[] {
  if (!value.trim()) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown[];
  return parsed.map((variable) => promptVariableSchema.parse(variable));
}

export function parseItemFormData(formData: FormData, type: ItemType) {
  return itemEditorInputSchema.parse({
    type,
    title: getFormValue(formData, "title"),
    summary: getFormValue(formData, "summary"),
    content: getFormValue(formData, "content"),
    category: getFormValue(formData, "category"),
    tags: parseTagsInput(getFormValue(formData, "tags")),
    sourceUrl: getFormValue(formData, "sourceUrl"),
    variables: type === "prompt"
      ? parseVariablesInput(getFormValue(formData, "variables"))
      : [],
  });
}
```

- [ ] **Step 4: Implement mutation server actions**

```ts
// src/server/items/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createItem, deleteItem, recordCopyAction, replacePromptVariables, toggleFavorite, updateItem } from "@/server/db/items";

import { parseItemFormData } from "./forms";

export interface ItemFormState {
  status: "idle" | "error";
  message: string;
}

export const initialItemFormState: ItemFormState = {
  status: "idle",
  message: "",
};

function revalidateLibraryPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createPromptAction(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  try {
    const { variables, ...input } = parseItemFormData(formData, "prompt");
    const item = await createItem(input);
    await replacePromptVariables(item.id, variables);
    revalidateLibraryPaths(["/prompts", "/dashboard"]);
    redirect(`/prompts/${item.id}`);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save Prompt.",
    };
  }
}

export async function createSkillAction(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  try {
    const { variables: _variables, ...input } = parseItemFormData(formData, "skill");
    const item = await createItem(input);
    revalidateLibraryPaths(["/skills", "/dashboard"]);
    redirect(`/skills/${item.id}`);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save Skill.",
    };
  }
}

export async function updatePromptAction(
  itemId: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  try {
    const { variables, ...input } = parseItemFormData(formData, "prompt");
    await updateItem(itemId, input);
    await replacePromptVariables(itemId, variables);
    revalidateLibraryPaths(["/prompts", `/prompts/${itemId}`, "/dashboard"]);
    redirect(`/prompts/${itemId}`);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update Prompt.",
    };
  }
}

export async function updateSkillAction(
  itemId: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  try {
    const { variables: _variables, ...input } = parseItemFormData(formData, "skill");
    await updateItem(itemId, input);
    revalidateLibraryPaths(["/skills", `/skills/${itemId}`, "/dashboard"]);
    redirect(`/skills/${itemId}`);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update Skill.",
    };
  }
}

export async function toggleFavoriteAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "/dashboard");
  await toggleFavorite(itemId);
  revalidateLibraryPaths([returnPath, "/dashboard"]);
}

export async function deleteItemAction(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const type = String(formData.get("type") ?? "prompt");
  await deleteItem(itemId);
  revalidateLibraryPaths(["/dashboard", "/prompts", "/skills"]);
  redirect(type === "skill" ? "/skills?deleted=1" : "/prompts?deleted=1");
}

export async function recordCopyActionAction(input: {
  itemId: string;
  action: "copy_raw";
  revalidatePaths: string[];
}) {
  await recordCopyAction(input.itemId, input.action);
  revalidateLibraryPaths(input.revalidatePaths);
}
```

- [ ] **Step 5: Run the form/action tests again**

Run:

```bash
npm run test -- src/server/items/forms.test.ts src/server/items/actions.test.ts
```

Expected:

```text
PASS src/server/items/forms.test.ts
PASS src/server/items/actions.test.ts
```

- [ ] **Step 6: Commit the server mutation layer**

```bash
git add src/server/items/forms.ts src/server/items/forms.test.ts src/server/items/actions.ts src/server/items/actions.test.ts
git commit -m "feat: add phase 3 item server actions"
```

### Task 4: Build shared library UI for lists, detail, forms, copy, and delete confirmation

**Files:**
- Create: `src/components/library/library-filters.tsx`
- Create: `src/components/library/library-list.tsx`
- Create: `src/components/library/item-detail-view.tsx`
- Test: `src/components/library/item-detail-view.test.tsx`
- Create: `src/components/library/item-form.tsx`
- Create: `src/components/library/prompt-variables-editor.tsx`
- Create: `src/components/library/copy-raw-button.tsx`
- Create: `src/components/library/delete-item-button.tsx`

- [ ] **Step 1: Write the failing detail-view render test**

```ts
// src/components/library/item-detail-view.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ItemDetailView } from "./item-detail-view";

const promptItem = {
  id: "prompt-1",
  userId: "user-1",
  type: "prompt" as const,
  title: "Prompt A",
  summary: "Summary",
  content: "Write about {{topic}}",
  category: "Coding" as const,
  tags: ["ts"],
  sourceUrl: "",
  isFavorite: false,
  isAnalyzed: false,
  usageCount: 2,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
  variables: [
    {
      id: "var-1",
      itemId: "prompt-1",
      name: "topic",
      description: "focus area",
      defaultValue: "TypeScript",
      required: true,
      sortOrder: 0,
      createdAt: "2026-05-01T00:00:00.000Z",
    },
  ],
};

describe("ItemDetailView", () => {
  it("renders prompt variables and a raw copy action", () => {
    const html = renderToStaticMarkup(
      <ItemDetailView item={promptItem} returnPath="/prompts" />,
    );

    expect(html).toContain("Variables");
    expect(html).toContain("topic");
    expect(html).toContain("Copy raw Prompt");
  });
});
```

- [ ] **Step 2: Run the component render test to verify the shared detail view does not exist**

Run:

```bash
npm run test -- src/components/library/item-detail-view.test.tsx
```

Expected:

```text
FAIL src/components/library/item-detail-view.test.tsx
```

- [ ] **Step 3: Implement the shared form and detail components**

```tsx
// src/components/library/library-filters.tsx
import type { ListItemsFilters, ItemType } from "@/lib/schema/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LibraryFilters({
  type,
  filters,
}: Readonly<{
  type: ItemType;
  filters: ListItemsFilters;
}>) {
  return (
    <form action={type === "prompt" ? "/prompts" : "/skills"} className="grid gap-3 rounded-[24px] border border-border/70 bg-background/90 p-4 md:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
      <Input name="search" defaultValue={filters.search ?? ""} placeholder="Search title, summary, raw content" />
      <Input name="category" defaultValue={filters.category ?? ""} placeholder="Category" />
      <Input name="tag" defaultValue={filters.tag ?? ""} placeholder="Tag" />
      <div className="flex gap-2">
        <input type="hidden" name="favorite" value={filters.isFavorite ? "1" : ""} />
        <Button type="submit" variant="outline">Apply</Button>
      </div>
    </form>
  );
}
```

```tsx
// src/components/library/library-list.tsx
import Link from "next/link";

import type { ItemType, ListItemsFilters } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LibraryFilters } from "./library-filters";

export function LibraryList({
  type,
  items,
  filters,
}: Readonly<{
  type: ItemType;
  items: StoredItem[];
  filters: ListItemsFilters;
}>) {
  const title = type === "prompt" ? "Prompt library" : "Skill library";
  const emptyTitle = type === "prompt" ? "No prompts yet" : "No skills yet";
  const createHref = type === "prompt" ? "/prompts/new" : "/skills/new";
  const detailBase = type === "prompt" ? "/prompts" : "/skills";

  return (
    <section className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Search, favorite, open, edit, delete, and copy raw content.
            </p>
          </div>
          <Link href={createHref} className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
            {type === "prompt" ? "New Prompt" : "New Skill"}
          </Link>
        </div>
        <LibraryFilters type={type} filters={filters} />
      </div>
      {items.length === 0 ? (
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>{emptyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Change the keyword or filters, or create your first saved item.</p>
            <Link href={createHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Create now
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`${detailBase}/${item.id}`}
              className="rounded-[24px] border border-border/70 bg-background/90 p-5 shadow-[0_10px_24px_-22px_rgba(17,17,17,0.35)] transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant="secondary">{item.category}</Badge>
                    {item.isFavorite ? <Badge variant="outline">Favorite</Badge> : null}
                    {!item.isAnalyzed ? <Badge variant="outline">Need analyze</Badge> : null}
                  </div>
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">{item.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Copied {item.usageCount}</div>
                  <div className="mt-1">{item.updatedAt}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
```

```tsx
// src/components/library/prompt-variables-editor.tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function createEmptyVariable(sortOrder: number) {
  return {
    id: `draft-${sortOrder}`,
    name: "",
    description: "",
    defaultValue: "",
    required: false,
    sortOrder,
  };
}

export function PromptVariablesEditor({
  initialValues,
}: Readonly<{
  initialValues: Array<{
    id?: string;
    name: string;
    description: string;
    defaultValue: string;
    required: boolean;
    sortOrder: number;
  }>;
}>) {
  const [rows, setRows] = useState(
    initialValues.length > 0 ? initialValues : [],
  );

  return (
    <section className="space-y-4">
      <input type="hidden" name="variables" value={JSON.stringify(rows)} />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Variables</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRows((current) => [...current, createEmptyVariable(current.length)])
          }
        >
          Add variable
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          This Prompt has no variables yet. Saving with zero variables is valid in Phase 3.
        </div>
      ) : (
        rows.map((row, index) => (
          <div key={row.id ?? row.sortOrder} className="grid gap-3 rounded-2xl border border-border/70 p-4">
            <Input
              value={row.name}
              placeholder="Variable name"
              onChange={(event) =>
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name: event.target.value } : item,
                  ),
                )
              }
            />
            <Input
              value={row.description}
              placeholder="Description"
              onChange={(event) =>
                setRows((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, description: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </div>
        ))
      )}
    </section>
  );
}
```

```tsx
// src/components/library/copy-raw-button.tsx
"use client";

import { useState, useTransition } from "react";

import type { ItemDetail } from "@/server/db/types";
import { recordCopyActionAction } from "@/server/items/actions";
import { Button } from "@/components/ui/button";

export function CopyRawButton({
  item,
  returnPath,
}: Readonly<{
  item: ItemDetail;
  returnPath: string;
}>) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        size="lg"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(item.content);
            startTransition(async () => {
              await recordCopyActionAction({
                itemId: item.id,
                action: "copy_raw",
                revalidatePaths: [returnPath, "/dashboard"],
              });
            });
            setMessage(item.type === "prompt" ? "Raw Prompt copied." : "Raw Skill copied.");
          } catch {
            setMessage("Copy failed. Check clipboard permission and try again.");
          }
        }}
        disabled={pending}
      >
        {pending
          ? "Recording..."
          : item.type === "prompt"
            ? "Copy raw Prompt"
            : "Copy raw Skill"}
      </Button>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
    </div>
  );
}
```

```tsx
// src/components/library/delete-item-button.tsx
"use client";

import { deleteItemAction } from "@/server/items/actions";
import { Button } from "@/components/ui/button";

export function DeleteItemButton({
  itemId,
  itemType,
}: Readonly<{
  itemId: string;
  itemType: "prompt" | "skill";
}>) {
  return (
    <form
      action={deleteItemAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this item? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="type" value={itemType} />
      <Button type="submit" variant="destructive" size="lg">
        Delete
      </Button>
    </form>
  );
}
```

```tsx
// src/components/library/item-form.tsx
"use client";

import { useActionState } from "react";

import type { ItemType, PromptVariableInput } from "@/lib/schema/items";
import type { ItemFormState } from "@/server/items/actions";
import { initialItemFormState } from "@/server/items/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { PromptVariablesEditor } from "./prompt-variables-editor";

export function ItemForm({
  type,
  action,
  initialValues,
  submitLabel,
}: Readonly<{
  type: ItemType;
  action: (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  initialValues: {
    title: string;
    summary: string;
    category: string;
    tags: string[];
    content: string;
    sourceUrl: string;
    variables: PromptVariableInput[];
  };
  submitLabel: string;
}>) {
  const [state, formAction, pending] = useActionState(action, initialItemFormState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="title" defaultValue={initialValues.title} placeholder="Title" />
        <Input name="category" defaultValue={initialValues.category} placeholder="Category" />
      </div>
      <Textarea name="summary" defaultValue={initialValues.summary} placeholder="Summary" />
      <Input name="tags" defaultValue={initialValues.tags.join(", ")} placeholder="tag-a, tag-b" />
      <Textarea name="content" defaultValue={initialValues.content} placeholder="Paste raw content" className="min-h-72" />
      <input type="hidden" name="sourceUrl" value={initialValues.sourceUrl} />
      {type === "prompt" ? (
        <PromptVariablesEditor initialValues={initialValues.variables} />
      ) : null}
      {state.status === "error" ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

```tsx
// src/components/library/item-detail-view.tsx
import Link from "next/link";

import type { ItemDetail } from "@/server/db/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { CopyRawButton } from "./copy-raw-button";
import { DeleteItemButton } from "./delete-item-button";

export function ItemDetailView({
  item,
  returnPath,
}: Readonly<{
  item: ItemDetail;
  returnPath: string;
}>) {
  const editPath =
    item.type === "prompt" ? `/prompts/${item.id}/edit` : `/skills/${item.id}/edit`;

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="gap-4 border-b border-border/70 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{item.type}</Badge>
            <Badge variant="secondary">{item.category}</Badge>
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="space-y-3">
            <CardTitle className="text-3xl tracking-[-0.04em]">{item.title}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CopyRawButton item={item} returnPath={returnPath} />
            <Link href={editPath} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Edit
            </Link>
            <DeleteItemButton itemId={item.id} itemType={item.type} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {item.type === "prompt" ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Variables</h2>
              {item.variables.length === 0 ? (
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  No variables saved. This Prompt still supports raw-copy in Phase 3.
                </div>
              ) : (
                item.variables.map((variable) => (
                  <div key={variable.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm font-medium">{variable.name}</div>
                      {variable.required ? <Badge variant="outline">Required</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{variable.description}</p>
                  </div>
                ))
              )}
            </section>
          ) : null}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Raw content</h2>
            <pre className="overflow-x-auto rounded-[22px] border border-border/70 bg-muted/30 p-4 text-xs leading-6 whitespace-pre-wrap">
              {item.content}
            </pre>
          </section>
        </CardContent>
      </Card>
      <div className="flex justify-start">
        <Link href={returnPath} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Back to library
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the detail-view test again**

Run:

```bash
npm run test -- src/components/library/item-detail-view.test.tsx
```

Expected:

```text
PASS src/components/library/item-detail-view.test.tsx
```

- [ ] **Step 5: Commit the shared library UI shell**

```bash
git add src/components/library/library-filters.tsx src/components/library/library-list.tsx src/components/library/item-detail-view.tsx src/components/library/item-detail-view.test.tsx src/components/library/item-form.tsx src/components/library/prompt-variables-editor.tsx src/components/library/copy-raw-button.tsx src/components/library/delete-item-button.tsx
git commit -m "feat: add shared phase 3 library components"
```

### Task 5: Implement the Prompt list, create, detail, and edit routes

**Files:**
- Modify: `src/app/(workspace)/prompts/page.tsx`
- Create: `src/app/(workspace)/prompts/new/page.tsx`
- Create: `src/app/(workspace)/prompts/[id]/page.tsx`
- Create: `src/app/(workspace)/prompts/[id]/edit/page.tsx`

- [ ] **Step 1: Write a failing Prompt page smoke test**

```ts
// src/components/library/library-list.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LibraryList } from "./library-list";

describe("LibraryList", () => {
  it("renders empty-state CTA for prompt libraries with no items", () => {
    const html = renderToStaticMarkup(
      <LibraryList
        type="prompt"
        items={[]}
        filters={{ type: "prompt", sort: "updated", limit: 50 }}
      />,
    );

    expect(html).toContain("No prompts yet");
    expect(html).toContain("/prompts/new");
  });
});
```

- [ ] **Step 2: Run the Prompt list smoke test to verify the real list component is incomplete**

Run:

```bash
npm run test -- src/components/library/library-list.test.tsx
```

Expected:

```text
FAIL src/components/library/library-list.test.tsx
```

- [ ] **Step 3: Implement the Prompt pages against the shared components**

```tsx
// src/app/(workspace)/prompts/page.tsx
import { parseLibrarySearchParams } from "@/features/items/query-state";
import { LibraryList } from "@/components/library/library-list";
import { listItems } from "@/server/db/items";

export default async function PromptsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const filters = parseLibrarySearchParams(await searchParams, "prompt");
  const items = await listItems(filters);

  return <LibraryList type="prompt" items={items} filters={filters} />;
}
```

```tsx
// src/app/(workspace)/prompts/new/page.tsx
import { ItemForm } from "@/components/library/item-form";
import { createPromptAction } from "@/server/items/actions";

export default function NewPromptPage() {
  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">New Prompt</h1>
        <p className="text-sm text-muted-foreground">
          Save the raw Prompt first. Variables are optional in Phase 3.
        </p>
      </div>
      <ItemForm
        type="prompt"
        action={createPromptAction}
        submitLabel="Save Prompt"
        initialValues={{
          title: "",
          summary: "",
          category: "Other",
          tags: [],
          content: "",
          sourceUrl: "",
          variables: [],
        }}
      />
    </section>
  );
}
```

```tsx
// src/app/(workspace)/prompts/[id]/page.tsx
import { notFound } from "next/navigation";

import { ItemDetailView } from "@/components/library/item-detail-view";
import { getItemDetail } from "@/server/db/items";

export default async function PromptDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item || item.type !== "prompt") {
    notFound();
  }

  return <ItemDetailView item={item} returnPath="/prompts" />;
}
```

```tsx
// src/app/(workspace)/prompts/[id]/edit/page.tsx
import { notFound } from "next/navigation";

import { ItemForm } from "@/components/library/item-form";
import { getItemDetail } from "@/server/db/items";
import { updatePromptAction } from "@/server/items/actions";

export default async function EditPromptPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item || item.type !== "prompt") {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Edit Prompt</h1>
        <p className="text-sm text-muted-foreground">
          Update raw content and variable definitions without calling DeepSeek.
        </p>
      </div>
      <ItemForm
        type="prompt"
        action={updatePromptAction.bind(null, item.id)}
        submitLabel="Update Prompt"
        initialValues={{
          title: item.title,
          summary: item.summary,
          category: item.category,
          tags: item.tags,
          content: item.content,
          sourceUrl: item.sourceUrl,
          variables: item.variables,
        }}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the Prompt list test and the current focused suite**

Run:

```bash
npm run test -- src/components/library/library-list.test.tsx src/components/library/item-detail-view.test.tsx src/server/items/forms.test.ts src/server/items/actions.test.ts
```

Expected:

```text
PASS src/components/library/library-list.test.tsx
PASS src/components/library/item-detail-view.test.tsx
PASS src/server/items/forms.test.ts
PASS src/server/items/actions.test.ts
```

- [ ] **Step 5: Commit the Prompt flow**

```bash
git add src/app/(workspace)/prompts/page.tsx src/app/(workspace)/prompts/new/page.tsx src/app/(workspace)/prompts/[id]/page.tsx src/app/(workspace)/prompts/[id]/edit/page.tsx src/components/library/library-list.test.tsx
git commit -m "feat: implement prompt library pages"
```

### Task 6: Implement the Skill list, create, detail, and edit routes

**Files:**
- Modify: `src/app/(workspace)/skills/page.tsx`
- Create: `src/app/(workspace)/skills/new/page.tsx`
- Create: `src/app/(workspace)/skills/[id]/page.tsx`
- Create: `src/app/(workspace)/skills/[id]/edit/page.tsx`

- [ ] **Step 1: Write a failing Skill list smoke test**

```ts
// append to src/components/library/library-list.test.tsx
it("renders empty-state CTA for skill libraries with no items", () => {
  const html = renderToStaticMarkup(
    <LibraryList
      type="skill"
      items={[]}
      filters={{ type: "skill", sort: "updated", limit: 50 }}
    />,
  );

  expect(html).toContain("No skills yet");
  expect(html).toContain("/skills/new");
});
```

- [ ] **Step 2: Run the Skill smoke test to verify the shared list copy is not finished**

Run:

```bash
npm run test -- src/components/library/library-list.test.tsx
```

Expected:

```text
FAIL src/components/library/library-list.test.tsx
```

- [ ] **Step 3: Implement the Skill pages by reusing the shared library shell**

```tsx
// src/app/(workspace)/skills/page.tsx
import { parseLibrarySearchParams } from "@/features/items/query-state";
import { LibraryList } from "@/components/library/library-list";
import { listItems } from "@/server/db/items";

export default async function SkillsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const filters = parseLibrarySearchParams(await searchParams, "skill");
  const items = await listItems(filters);

  return <LibraryList type="skill" items={items} filters={filters} />;
}
```

```tsx
// src/app/(workspace)/skills/new/page.tsx
import { ItemForm } from "@/components/library/item-form";
import { createSkillAction } from "@/server/items/actions";

export default function NewSkillPage() {
  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">New Skill</h1>
        <p className="text-sm text-muted-foreground">
          Save raw Skill content manually in Phase 3. GitHub import remains a Phase 5 feature.
        </p>
      </div>
      <ItemForm
        type="skill"
        action={createSkillAction}
        submitLabel="Save Skill"
        initialValues={{
          title: "",
          summary: "",
          category: "Other",
          tags: [],
          content: "",
          sourceUrl: "",
          variables: [],
        }}
      />
    </section>
  );
}
```

```tsx
// src/app/(workspace)/skills/[id]/page.tsx
import { notFound } from "next/navigation";

import { ItemDetailView } from "@/components/library/item-detail-view";
import { getItemDetail } from "@/server/db/items";

export default async function SkillDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item || item.type !== "skill") {
    notFound();
  }

  return <ItemDetailView item={item} returnPath="/skills" />;
}
```

```tsx
// src/app/(workspace)/skills/[id]/edit/page.tsx
import { notFound } from "next/navigation";

import { ItemForm } from "@/components/library/item-form";
import { getItemDetail } from "@/server/db/items";
import { updateSkillAction } from "@/server/items/actions";

export default async function EditSkillPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item || item.type !== "skill") {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Edit Skill</h1>
        <p className="text-sm text-muted-foreground">
          Update raw Skill content manually. GitHub import stays disabled until Phase 5.
        </p>
      </div>
      <ItemForm
        type="skill"
        action={updateSkillAction.bind(null, item.id)}
        submitLabel="Update Skill"
        initialValues={{
          title: item.title,
          summary: item.summary,
          category: item.category,
          tags: item.tags,
          content: item.content,
          sourceUrl: item.sourceUrl,
          variables: [],
        }}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the list/detail/form test slice again**

Run:

```bash
npm run test -- src/components/library/library-list.test.tsx src/components/library/item-detail-view.test.tsx src/server/items/forms.test.ts src/server/items/actions.test.ts
```

Expected:

```text
PASS src/components/library/library-list.test.tsx
PASS src/components/library/item-detail-view.test.tsx
PASS src/server/items/forms.test.ts
PASS src/server/items/actions.test.ts
```

- [ ] **Step 5: Commit the Skill flow**

```bash
git add src/app/(workspace)/skills/page.tsx src/app/(workspace)/skills/new/page.tsx src/app/(workspace)/skills/[id]/page.tsx src/app/(workspace)/skills/[id]/edit/page.tsx src/components/library/library-list.test.tsx
git commit -m "feat: implement skill library pages"
```

### Task 7: Wire Dashboard aggregation and the shared workspace search / CTA shell

**Files:**
- Modify: `src/components/dashboard/dashboard-view.tsx`
- Test: `src/components/dashboard/dashboard-view.test.tsx`
- Modify: `src/app/(workspace)/dashboard/page.tsx`
- Modify: `src/components/layout/workspace-shell.tsx`
- Create: `src/components/layout/global-search-form.tsx`

- [ ] **Step 1: Write a failing Dashboard render test**

```ts
// src/components/dashboard/dashboard-view.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardView } from "./dashboard-view";

describe("DashboardView", () => {
  it("renders real summary counts and quick-add links", () => {
    const html = renderToStaticMarkup(
      <DashboardView
        snapshot={{
          counts: {
            total: 6,
            prompts: 4,
            skills: 2,
            pending: 3,
          },
          recent: [],
          favorites: [],
          pending: [],
        }}
      />,
    );

    expect(html).toContain("6");
    expect(html).toContain("/prompts/new");
    expect(html).toContain("/skills/new");
  });
});
```

- [ ] **Step 2: Run the Dashboard render test to verify the mock-driven component no longer matches the target**

Run:

```bash
npm run test -- src/components/dashboard/dashboard-view.test.tsx
```

Expected:

```text
FAIL src/components/dashboard/dashboard-view.test.tsx
```

- [ ] **Step 3: Implement real dashboard props, topbar search, and phase-correct CTAs**

```tsx
// src/app/(workspace)/dashboard/page.tsx
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardSnapshot } from "@/server/db/items";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();
  return <DashboardView snapshot={snapshot} />;
}
```

```tsx
// src/components/layout/global-search-form.tsx
"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

function resolveActionPath(pathname: string) {
  if (pathname.startsWith("/skills")) return "/skills";
  if (pathname.startsWith("/prompts")) return "/prompts";
  return "/prompts";
}

export function GlobalSearchForm() {
  const pathname = usePathname();
  const actionPath = useMemo(() => resolveActionPath(pathname), [pathname]);
  const [value, setValue] = useState("");

  return (
    <form action={actionPath} className="relative ml-auto w-full max-w-xl lg:ml-0">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search library"
        name="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search titles, tags, or raw content"
        className="h-10 rounded-xl bg-muted/50 pl-10"
      />
    </form>
  );
}
```

```tsx
// focused edits in src/components/layout/workspace-shell.tsx
import { GitBranchIcon, LogOutIcon, SquarePenIcon } from "lucide-react";

import { GlobalSearchForm } from "@/components/layout/global-search-form";

<GlobalSearchForm />

<Link
  href="/prompts/new"
  className={cn(buttonVariants({ variant: "default", size: "lg" }))}
>
  <SquarePenIcon className="size-4" />
  New prompt
</Link>
<Link
  href="/skills/new"
  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
>
  <GitBranchIcon className="size-4" />
  New skill
</Link>
```

```tsx
// signature change in src/components/dashboard/dashboard-view.tsx
import Link from "next/link";

import type { DashboardSnapshot } from "@/server/db/types";

export function DashboardView({
  snapshot,
}: Readonly<{
  snapshot: DashboardSnapshot;
}>) {
  const { counts, favorites, pending, recent } = snapshot;

  return (
    <section className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="surface-noise rounded-[28px] border border-border/70 shadow-[0_20px_60px_-36px_rgba(17,17,17,0.32)]">
          <CardHeader className="gap-4 border-b border-border/60 pb-6">
            <Badge variant="outline" className="w-fit rounded-full border-border/80 bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Save → Search → Open → Copy
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.04em] lg:text-5xl">
                Your private command shelf for prompts and skills.
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                RoBox Phase 3 接入真实库数据。搜索入口在顶栏，下面聚合最近使用、收藏、待整理与数量统计。
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/prompts/new" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
                New prompt
              </Link>
              <Link href="/skills/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                New skill
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total" value={counts.total} detail="Prompt + Skill" />
            <MetricCard label="Prompts" value={counts.prompts} detail="可变量化模板" />
            <MetricCard label="Skills" value={counts.skills} detail="可复制 Skill 原文" />
            <MetricCard label="Pending" value={counts.pending} detail="待智能整理" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the Dashboard and focused component suite**

Run:

```bash
npm run test -- src/components/dashboard/dashboard-view.test.tsx src/components/library/library-list.test.tsx src/components/library/item-detail-view.test.tsx
```

Expected:

```text
PASS src/components/dashboard/dashboard-view.test.tsx
PASS src/components/library/library-list.test.tsx
PASS src/components/library/item-detail-view.test.tsx
```

- [ ] **Step 5: Commit the dashboard and shell wiring**

```bash
git add src/components/dashboard/dashboard-view.tsx src/components/dashboard/dashboard-view.test.tsx src/app/(workspace)/dashboard/page.tsx src/components/layout/workspace-shell.tsx src/components/layout/global-search-form.tsx
git commit -m "feat: wire dashboard and workspace search"
```

### Task 8: Update docs and run the full verification pass

**Files:**
- Modify: `README.md`
- Modify: `docs/setup.md`

- [ ] **Step 1: Update the stale Phase 2 wording in the docs**

Replace the outdated statements that say the main pages still render static mock data.

Use this exact wording in the affected sections:

```md
- `/dashboard`、`/prompts`、`/skills`、`/settings` require a valid Supabase session.
- Prompt / Skill pages now run against the real repository layer for create, list, detail, edit, favorite, delete, and raw-copy logging.
```

```md
- 当前已落地：真实 Dashboard 聚合、Prompts / Skills 列表、详情、编辑、删除、收藏、复制原文与 `usage_logs` 写入
- `RoBox_UI_Prototype/` 继续只作为交互参考，正式工作台页面已接入真实数据流
```

- [ ] **Step 2: Run the entire project test suite**

Run:

```bash
npm run test
```

Expected:

```text
PASS
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected:

```text
0 errors
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected:

```text
Found 0 errors
```

- [ ] **Step 5: Run the production build**

Run:

```bash
npm run build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 6: Commit docs and verification-ready integration**

```bash
git add README.md docs/setup.md
git commit -m "docs: update phase 3 library workflow"
```
