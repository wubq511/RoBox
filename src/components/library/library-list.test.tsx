import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} data-next-link="true">
      {children}
    </a>
  ),
}));

vi.mock("./batch-analyze-button", () => ({
  BatchAnalyzeButton: () => <div data-testid="batch-analyze" />,
}));

vi.mock("./library-filters", () => ({
  LibraryFilters: () => <div data-testid="library-filters" />,
}));

vi.mock("./favorite-toggle-button", () => ({
  FavoriteToggleButton: ({ itemId }: { itemId: string }) => (
    <button data-testid="favorite-toggle" data-item-id={itemId} />
  ),
}));

import { LibraryList } from "./library-list";

describe("LibraryList", () => {
  const categories = ["Writing", "Coding", "Other"];

  it("renders the prompt library shell with header and create CTA", () => {
    const filters: ListItemsFilters = {
      type: "prompt",
      search: "draft",
      sort: "updated",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList
        type="prompt"
        items={[]}
        filters={filters}
        categories={categories}
      />,
    );

    expect(html).toContain("Prompt 库");
    expect(html).toContain('href="/prompts/new"');
    expect(html).toContain("新建 Prompt");
    expect(html).toContain("还没有 Prompt");
  });

  it("renders the skill library shell with header and create CTA", () => {
    const filters: ListItemsFilters = {
      type: "skill",
      isFavorite: true,
      sort: "used",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList
        type="skill"
        items={[]}
        filters={filters}
        categories={categories}
      />,
    );

    expect(html).toContain("Skill 库");
    expect(html).toContain('href="/skills/new"');
    expect(html).toContain("新建 Skill");
    expect(html).toContain("还没有 Skill");
  });

  it("renders non-empty items with card metadata", () => {
    const filters: ListItemsFilters = {
      type: "prompt",
      sort: "used",
      limit: 50,
    };
    const items: StoredItem[] = [
      {
        id: "prompt-1",
        userId: "user-1",
        type: "prompt",
        title: "Prompt title",
        summary: "Prompt summary",
        content: "Prompt content",
        category: "Writing",
        tags: ["draft"],
        sourceUrl: "",
        isFavorite: true,
        isAnalyzed: false,
        usageCount: 2,
        createdAt: "2026-05-01T12:00:00.000Z",
        updatedAt: "2026-05-01 20:00",
      },
    ];

    const html = renderToStaticMarkup(
      <LibraryList
        type="prompt"
        items={items}
        filters={filters}
        categories={categories}
      />,
    );

    expect(html).toContain(
      'href="/prompts/prompt-1" class="block" data-next-link="true"',
    );
    expect(html).toContain("Prompt title");
    expect(html).toContain("待整理");
    expect(html).toContain("Writing");
    expect(html).toContain("复制 2 次");
  });
});
