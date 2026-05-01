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

import EditSkillPage from "./[id]/edit/page";
import SkillDetailPage from "./[id]/page";
import NewSkillPage from "./new/page";
import SkillsPage from "./page";

describe("skill routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(markup).toContain("Skill library");
    expect(markup).toContain('href="/skills/skill-1"');
  });

  it("renders the new skill route with a hidden skill type field and source URL input", async () => {
    const markup = renderToStaticMarkup(await NewSkillPage());

    expect(markup).toContain('name="type" value="skill"');
    expect(markup).toContain("New Skill");
    expect(markup).toContain("Save Skill");
    expect(markup).toContain("Source URL");
    expect(markup).not.toContain("Variables");
  });

  it("renders the skill detail route for skill items", async () => {
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
      await SkillDetailPage({
        params: Promise.resolve({ id: "skill-1" }),
      }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("skill-1");
    expect(markup).toContain("Skill title");
    expect(markup).toContain("Source");
    expect(markup).toContain('href="/skills/skill-1/edit"');
  });

  it("renders the skill edit route for skill items", async () => {
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
      await EditSkillPage({
        params: Promise.resolve({ id: "skill-1" }),
      }),
    );

    expect(mocks.getItemDetail).toHaveBeenCalledWith("skill-1");
    expect(markup).toContain('name="type" value="skill"');
    expect(markup).toContain("Edit Skill");
    expect(markup).toContain("Update Skill");
    expect(markup).toContain('name="sourceUrl" value="https://github.com/example/repo"');
  });

  it("calls notFound when the skill detail route resolves a missing item", async () => {
    mocks.getItemDetail.mockResolvedValue(null);

    await expect(
      SkillDetailPage({
        params: Promise.resolve({ id: "missing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when the skill edit route resolves a prompt item", async () => {
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
      EditSkillPage({
        params: Promise.resolve({ id: "prompt-1" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });
});
