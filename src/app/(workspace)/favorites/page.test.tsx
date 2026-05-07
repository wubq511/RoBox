import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

const mocks = vi.hoisted(() => ({
  parseFavoritesSearchParams: vi.fn(),
  listItems: vi.fn(),
}));

vi.mock("@/features/items/query-state", () => ({
  parseFavoritesSearchParams: mocks.parseFavoritesSearchParams,
}));

vi.mock("@/server/db/items", () => ({
  listItems: mocks.listItems,
}));

vi.mock("@/components/library/favorites-list", () => ({
  FavoritesList: ({ items }: { items: Array<{ id: string }> }) => (
    <div data-testid="favorites-list">
      {items.map((item) => (
        <span key={item.id}>{item.id}</span>
      ))}
    </div>
  ),
}));

import FavoritesPage from "./page";

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders favorites from parsed filters", async () => {
    const filters: ListItemsFilters = {
      isFavorite: true,
      search: "codex",
      sort: "updated",
      limit: 100,
    };
    const items = [
      {
        id: "favorite-1",
      },
    ] as StoredItem[];

    mocks.parseFavoritesSearchParams.mockReturnValue(filters);
    mocks.listItems.mockResolvedValue(items);

    const markup = renderToStaticMarkup(
      await FavoritesPage({
        searchParams: Promise.resolve({ search: "codex" }),
      }),
    );

    expect(mocks.parseFavoritesSearchParams).toHaveBeenCalledWith({
      search: "codex",
    });
    expect(mocks.listItems).toHaveBeenCalledWith(filters, {
      nextPath: "/favorites",
    });
    expect(markup).toContain("favorite-1");
  });
});
