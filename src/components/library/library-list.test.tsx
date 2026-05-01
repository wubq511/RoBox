import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

import { LibraryList } from "./library-list";

describe("LibraryList", () => {
  it("renders inline prompt filters with an apply action and the empty-state CTA", () => {
    const filters: ListItemsFilters = {
      type: "prompt",
      search: "draft",
      sort: "updated",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList type="prompt" items={[]} filters={filters} />,
    );

    expect(html).toContain('action="/prompts"');
    expect(html).toContain("Apply");
    expect(html).toContain('name="search"');
    expect(html).toContain("No prompts yet");
    expect(html).toContain("Create Prompt");
    expect(html).toContain('href="/prompts/new"');
  });

  it("renders inline skill filters with an apply action and the empty-state CTA", () => {
    const filters: ListItemsFilters = {
      type: "skill",
      isFavorite: true,
      sort: "used",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList type="skill" items={[]} filters={filters} />,
    );

    expect(html).toContain('action="/skills"');
    expect(html).toContain("Apply");
    expect(html).toContain("No skills yet");
    expect(html).toContain("Create Skill");
    expect(html).toContain('href="/skills/new"');
  });

  it("renders filters above non-empty items without requiring route pages to compose them", () => {
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
        isFavorite: false,
        isAnalyzed: true,
        usageCount: 2,
        createdAt: "2026-05-01T12:00:00.000Z",
        updatedAt: "2026-05-01 20:00",
      },
    ];

    const html = renderToStaticMarkup(
      <LibraryList type="prompt" items={items} filters={filters} />,
    );

    expect(html).toContain('action="/prompts"');
    expect(html).toContain("Apply");
    expect(html).toContain('href="/prompts/prompt-1"');
    expect(html).toContain("Prompt title");
  });
});
