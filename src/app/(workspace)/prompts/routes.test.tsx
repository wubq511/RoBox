import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { ItemDetail, StoredItem } from "@/server/db/types";

const mocks = vi.hoisted(() => ({
  parseLibrarySearchParams: vi.fn(),
  listItems: vi.fn(),
  getItemDetail: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/items/query-state", () => ({
  parseLibrarySearchParams: mocks.parseLibrarySearchParams,
}));

vi.mock("@/server/db/items", () => ({
  listItems: mocks.listItems,
  getItemDetail: mocks.getItemDetail,
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );

  return {
    ...actual,
    notFound: mocks.notFound,
  };
});

import PromptDetailPage from "./[id]/page";
import EditPromptPage from "./[id]/edit/page";
import NewPromptPage from "./new/page";
import PromptsPage from "./page";

describe("prompt routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the prompt list route from parsed search params and Supabase items", async () => {
    const filters: ListItemsFilters = {
      type: "prompt",
      search: "draft",
      sort: "updated",
      limit: 50,
    };
    const items: StoredItem[] = [
      {
        id: "prompt-1",
        userId: "user-1",
        type: "prompt",
        title: "Prompt title",
        summary: "Prompt summary",
        content: "Prompt body",
        category: "Writing",
        tags: ["draft"],
        sourceUrl: "",
        isFavorite: true,
        isAnalyzed: true,
        usageCount: 4,
        createdAt: "2026-05-01T12:00:00.000Z",
        updatedAt: "2026-05-01 20:00",
      },
    ];

    mocks.parseLibrarySearchParams.mockReturnValue(filters);
    mocks.listItems.mockResolvedValue(items);

    const markup = renderToStaticMarkup(
      await PromptsPage({
        searchParams: Promise.resolve({ search: "draft", sort: "updated" }),
      }),
    );

    expect(mocks.parseLibrarySearchParams).toHaveBeenCalledWith(
      { search: "draft", sort: "updated" },
      "prompt",
    );
    expect(mocks.listItems).toHaveBeenCalledWith(filters);
    expect(markup).toContain("Prompt library");
    expect(markup).toContain('href="/prompts/prompt-1"');
  });

  it("renders the new prompt route with a hidden prompt type field", async () => {
    const markup = renderToStaticMarkup(await NewPromptPage());

    expect(markup).toContain('name="type" value="prompt"');
    expect(markup).toContain("Save prompt");
    expect(markup).toContain("Variables");
  });

  it("renders the prompt detail route for prompt items", async () => {
    const item: ItemDetail = {
      id: "prompt-1",
      userId: "user-1",
      type: "prompt",
      title: "Prompt title",
      summary: "Prompt summary",
      content: "Prompt body",
      category: "Writing",
      tags: ["draft"],
      sourceUrl: "",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    mocks.getItemDetail.mockResolvedValue(item);

    const markup = renderToStaticMarkup(
      await PromptDetailPage({
        params: Promise.resolve({ id: "prompt-1" }),
      }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("prompt-1");
    expect(markup).toContain("Prompt title");
    expect(markup).toContain('href="/prompts/prompt-1/edit"');
  });

  it("renders the prompt edit route for prompt items", async () => {
    const item: ItemDetail = {
      id: "prompt-1",
      userId: "user-1",
      type: "prompt",
      title: "Prompt title",
      summary: "Prompt summary",
      content: "Prompt body",
      category: "Writing",
      tags: ["draft"],
      sourceUrl: "",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    mocks.getItemDetail.mockResolvedValue(item);

    const markup = renderToStaticMarkup(
      await EditPromptPage({
        params: Promise.resolve({ id: "prompt-1" }),
      }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("prompt-1");
    expect(markup).toContain('name="type" value="prompt"');
    expect(markup).toContain("Save changes");
    expect(markup).toContain('name="title" value="Prompt title"');
  });

  it("calls notFound when the prompt detail route resolves a missing item", async () => {
    mocks.getItemDetail.mockResolvedValue(null);

    await expect(
      PromptDetailPage({
        params: Promise.resolve({ id: "missing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });
});
