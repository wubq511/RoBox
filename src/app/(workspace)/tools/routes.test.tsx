import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { ItemDetail, StoredItem } from "@/server/db/types";

const mocks = vi.hoisted(() => ({
  parseLibrarySearchParams: vi.fn(),
  listItems: vi.fn(),
  getItemDetail: vi.fn(),
  requireAppUser: vi.fn(),
  ensureDefaultCategories: vi.fn(),
  getUserCategoryNames: vi.fn(),
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

vi.mock("@/server/auth/session", () => ({
  requireAppUser: mocks.requireAppUser,
}));

vi.mock("@/server/db/categories", () => ({
  ensureDefaultCategories: mocks.ensureDefaultCategories,
  getUserCategoryNames: mocks.getUserCategoryNames,
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

vi.mock("@/components/library/item-detail-view", () => ({
  ItemDetailView: ({ item, returnPath }: { item: { id: string; title: string }; returnPath: string }) => (
    <div data-testid="item-detail-view" data-item-id={item.id} data-return-path={returnPath}>
      {item.title}
      <a href={`${returnPath}/${item.id}/edit`}>edit</a>
    </div>
  ),
}));

vi.mock("@/components/library/library-list", () => ({
  LibraryList: ({ type, items }: { type: string; items: Array<{ id: string }> }) => (
    <div data-testid="library-list" data-type={type}>
      {items.map((item) => <a key={item.id} href={`/tools/${item.id}`}>{item.id}</a>)}
    </div>
  ),
}));

import { ToolDetailContent } from "./[id]/page";
import { EditToolContent } from "./[id]/edit/page";
import NewToolPage from "./new/page";
import ToolsPage from "./page";

const defaultCategories = ["Writing", "Coding", "Research", "Design", "Study", "Agent", "Content", "Other"];

describe("tool routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAppUser.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    mocks.ensureDefaultCategories.mockResolvedValue(undefined);
    mocks.getUserCategoryNames.mockResolvedValue(defaultCategories);
  });

  it("renders the tool list route from parsed search params and Supabase items", async () => {
    const filters: ListItemsFilters = {
      type: "tool",
      search: "launcher",
      sort: "updated",
      limit: 50,
    };
    const items: StoredItem[] = [
      {
        id: "tool-1",
        userId: "user-1",
        type: "tool",
        title: "Raycast",
        summary: "Fast launcher",
        content: "https://raycast.com",
        category: "Coding",
        tags: ["launcher"],
        sourceUrl: "https://raycast.com/",
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
      await ToolsPage({
        searchParams: Promise.resolve({ search: "launcher", sort: "updated" }),
      }),
    );

    expect(mocks.parseLibrarySearchParams).toHaveBeenCalledWith(
      { search: "launcher", sort: "updated" },
      "tool",
    );
    expect(mocks.listItems).toHaveBeenCalledWith(filters);
    expect(markup).toContain('href="/tools/tool-1"');
    expect(markup).toContain('data-type="tool"');
  });

  it("renders the new tool route with GitHub and web import plus tool form", async () => {
    const markup = renderToStaticMarkup(await NewToolPage());

    expect(markup).toContain("从 GitHub 导入");
    expect(markup).toContain("从网站导入");
    expect(markup).toContain('name="type" value="tool"');
    expect(markup).toContain("新建 Tool");
    expect(markup).toContain("保存 Tool");
    expect(markup).toContain("来源链接");
  });

  it("renders the tool detail content for tool items", async () => {
    const item: ItemDetail = {
      id: "tool-1",
      userId: "user-1",
      type: "tool",
      title: "Raycast",
      summary: "Fast launcher",
      content: "https://raycast.com",
      category: "Coding",
      tags: ["launcher"],
      sourceUrl: "https://raycast.com/",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    mocks.getItemDetail.mockResolvedValue(item);

    const markup = renderToStaticMarkup(
      await ToolDetailContent({ id: "tool-1" }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("tool-1");
    expect(markup).toContain("Raycast");
    expect(markup).toContain('href="/tools/tool-1/edit"');
  });

  it("renders the tool edit content for tool items", async () => {
    const item: ItemDetail = {
      id: "tool-1",
      userId: "user-1",
      type: "tool",
      title: "Raycast",
      summary: "Fast launcher",
      content: "https://raycast.com",
      category: "Coding",
      tags: ["launcher"],
      sourceUrl: "https://raycast.com/",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    mocks.getItemDetail.mockResolvedValue(item);

    const markup = renderToStaticMarkup(
      await EditToolContent({ id: "tool-1" }),
    );

    expect(markup).toContain('name="type" value="tool"');
    expect(markup).toContain("编辑 Tool");
    expect(markup).toContain("更新 Tool");
    expect(markup).toContain('name="sourceUrl" value="https://raycast.com/"');
  });

  it("calls notFound when tool detail resolves a skill item", async () => {
    mocks.getItemDetail.mockResolvedValue({
      id: "skill-1",
      userId: "user-1",
      type: "skill",
      title: "Skill",
      summary: "",
      content: "body",
      category: "Agent",
      tags: [],
      sourceUrl: "",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    } satisfies ItemDetail);

    await expect(ToolDetailContent({ id: "skill-1" })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
