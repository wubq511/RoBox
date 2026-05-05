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
  ItemDetailView: ({ item, returnPath }: { item: { id: string; title: string; type: string }; returnPath: string }) => (
    <div data-testid="item-detail-view" data-item-id={item.id} data-return-path={returnPath}>
      {item.title}
      <a href={`${returnPath}/${item.id}/edit`}>edit</a>
    </div>
  ),
}));

vi.mock("@/components/library/library-list", () => ({
  LibraryList: ({ type, items }: { type: string; items: Array<{ id: string }> }) => (
    <div data-testid="library-list" data-type={type}>
      {items.map((item) => <a key={item.id} href={`/skills/${item.id}`}>{item.id}</a>)}
    </div>
  ),
}));

import { SkillDetailContent } from "./[id]/page";
import { EditSkillContent } from "./[id]/edit/page";
import NewSkillPage from "./new/page";
import SkillsPage from "./page";

const defaultCategories = ["Writing", "Coding", "Research", "Design", "Study", "Agent", "Content", "Other"];

describe("skill routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAppUser.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    mocks.ensureDefaultCategories.mockResolvedValue(undefined);
    mocks.getUserCategoryNames.mockResolvedValue(defaultCategories);
  });

  it("renders the skill list route from parsed search params and Supabase items", async () => {
    const filters: ListItemsFilters = {
      type: "skill",
      search: "agent",
      sort: "updated",
      limit: 50,
    };
    const items: StoredItem[] = [
      {
        id: "skill-1",
        userId: "user-1",
        type: "skill",
        title: "Skill title",
        summary: "Skill summary",
        content: "SKILL.md body",
        category: "Agent",
        tags: ["workflow"],
        sourceUrl: "https://github.com/example/repo",
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
      await SkillsPage({
        searchParams: Promise.resolve({ search: "agent", sort: "updated" }),
      }),
    );

    expect(mocks.parseLibrarySearchParams).toHaveBeenCalledWith(
      { search: "agent", sort: "updated" },
      "skill",
    );
    expect(mocks.listItems).toHaveBeenCalledWith(filters);
    expect(markup).toContain('href="/skills/skill-1"');
    expect(markup).toContain('data-type="skill"');
  });

  it("renders the new skill route with a hidden skill type field and source URL input", async () => {
    const markup = renderToStaticMarkup(await NewSkillPage());

    expect(markup).toContain("从 GitHub 导入");
    expect(markup).toContain('name="type" value="skill"');
    expect(markup).toContain("新建 Skill");
    expect(markup).toContain("保存 Skill");
    expect(markup).toContain("来源链接");
    expect(markup).not.toContain("Variables");
  });

  it("renders the skill detail content for skill items", async () => {
    const item: ItemDetail = {
      id: "skill-1",
      userId: "user-1",
      type: "skill",
      title: "Skill title",
      summary: "Skill summary",
      content: "SKILL.md body",
      category: "Agent",
      tags: ["workflow"],
      sourceUrl: "https://github.com/example/repo",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    mocks.getItemDetail.mockResolvedValue(item);

    const markup = renderToStaticMarkup(
      await SkillDetailContent({ id: "skill-1" }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("skill-1");
    expect(markup).toContain("Skill title");
    expect(markup).toContain('href="/skills/skill-1/edit"');
  });

  it("renders the skill edit content for skill items", async () => {
    const item: ItemDetail = {
      id: "skill-1",
      userId: "user-1",
      type: "skill",
      title: "Skill title",
      summary: "Skill summary",
      content: "SKILL.md body",
      category: "Agent",
      tags: ["workflow"],
      sourceUrl: "https://github.com/example/repo",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 1,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    mocks.getItemDetail.mockResolvedValue(item);

    const markup = renderToStaticMarkup(
      await EditSkillContent({ id: "skill-1" }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("skill-1");
    expect(markup).toContain('name="type" value="skill"');
    expect(markup).toContain("编辑 Skill");
    expect(markup).toContain("更新 Skill");
    expect(markup).toContain('name="sourceUrl" value="https://github.com/example/repo"');
  });

  it("calls notFound when the skill detail content resolves a missing item", async () => {
    mocks.getItemDetail.mockResolvedValue(null);

    await expect(
      SkillDetailContent({ id: "missing" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when the skill edit content resolves a prompt item", async () => {
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

    await expect(
      EditSkillContent({ id: "prompt-1" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });
});
