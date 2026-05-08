import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

vi.mock("./favorite-toggle-button", () => ({
  FavoriteToggleButton: ({ itemId }: { itemId: string }) => (
    <button data-testid="favorite-toggle" data-item-id={itemId} />
  ),
}));

vi.mock("./favorite-filters", () => ({
  FavoriteFilters: () => <div data-testid="favorite-filters" />,
}));

import { FavoritesList } from "./favorites-list";

function createStoredItem(overrides: Partial<StoredItem>): StoredItem {
  return {
    id: "item-1",
    userId: "user-1",
    type: "prompt",
    title: "Favorite item",
    summary: "Favorite summary",
    content: "Favorite content",
    category: "Coding",
    tags: [],
    sourceUrl: "",
    isFavorite: true,
    isAnalyzed: true,
    usageCount: 0,
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("FavoritesList", () => {
  it("renders mixed favorite item detail links", () => {
    const filters: ListItemsFilters = {
      isFavorite: true,
      sort: "updated",
      limit: 100,
    };
    const html = renderToStaticMarkup(
      <FavoritesList
        filters={filters}
        items={[
          createStoredItem({ id: "prompt-1", type: "prompt" }),
          createStoredItem({ id: "skill-1", type: "skill" }),
          createStoredItem({ id: "tool-1", type: "tool" }),
        ]}
      />,
    );

    expect(html).toContain("收藏");
    expect(html).toContain("已收藏 3 个");
    expect(html).toContain('href="/prompts/prompt-1"');
    expect(html).toContain('href="/skills/skill-1"');
    expect(html).toContain('href="/tools/tool-1"');
  });

  it("renders the empty favorite state", () => {
    const html = renderToStaticMarkup(
      <FavoritesList
        filters={{
          isFavorite: true,
          sort: "updated",
          limit: 100,
        }}
        items={[]}
      />,
    );

    expect(html).toContain("还没有收藏内容");
    expect(html).toContain('href="/prompts"');
    expect(html).toContain('href="/skills"');
    expect(html).toContain('href="/tools"');
  });
});
