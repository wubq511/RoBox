import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("search=agent"),
}));

import { FavoriteFilters } from "./favorite-filters";

describe("FavoriteFilters", () => {
  it("renders a client-side filter form without a fixed navigation action", () => {
    const html = renderToStaticMarkup(
      <FavoriteFilters
        filters={{
          isFavorite: true,
          search: "agent",
          sort: "updated",
          limit: 100,
        }}
      />,
    );

    expect(html).toContain("搜索收藏标题 / 描述 / 内容");
    expect(html).toContain('name="type"');
    expect(html).not.toContain('action="/favorites"');
  });
});
