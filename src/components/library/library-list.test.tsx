import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";
import type { StoredItem } from "@/server/db/types";

import { LibraryList } from "./library-list";

describe("LibraryList", () => {
  it("renders the prompt library shell with header, create CTA, filters, and empty-state guidance", () => {
    const filters: ListItemsFilters = {
      type: "prompt",
      search: "draft",
      sort: "updated",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList type="prompt" items={[]} filters={filters} />,
    );

    expect(html).toContain("Prompt library");
    expect(html).toContain("Variables, raw copy, edit, and saved search.");
    expect(html).toContain('href="/prompts/new"');
    expect(html).toContain("Create now");
    expect(html).toContain('action="/prompts"');
    expect(html).toContain("Apply");
    expect(html).toContain('name="search"');
    expect(html).toContain("No prompts yet");
    expect(html).toContain(
      "Change the keyword or filters, or create your first saved item.",
    );
  });

  it("renders the skill library shell with header, create CTA, filters, and empty-state guidance", () => {
    const filters: ListItemsFilters = {
      type: "skill",
      isFavorite: true,
      sort: "used",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList type="skill" items={[]} filters={filters} />,
    );

    expect(html).toContain("Skill library");
    expect(html).toContain("Save reusable SKILL.md files, linked sources, and copy-ready notes.");
    expect(html).toContain('href="/skills/new"');
    expect(html).toContain("Create now");
    expect(html).toContain('action="/skills"');
    expect(html).toContain("Apply");
    expect(html).toContain("No skills yet");
    expect(html).toContain(
      "Change the keyword or filters, or create your first saved item.",
    );
  });

  it("renders filters above non-empty items and shows the planned card metadata", () => {
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
      <LibraryList type="prompt" items={items} filters={filters} />,
    );

    expect(html).toContain('action="/prompts"');
    expect(html).toContain("Apply");
    expect(html).toContain('href="/prompts/prompt-1"');
    expect(html).toContain("Prompt title");
    expect(html).toContain("Favorite");
    expect(html).toContain("Need analyze");
    expect(html).toContain("Writing");
    expect(html).toContain("Copied 2");
  });
});
