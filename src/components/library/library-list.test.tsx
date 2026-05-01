import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ListItemsFilters } from "@/lib/schema/items";

import { LibraryList } from "./library-list";

describe("LibraryList", () => {
  it("accepts filters and renders the prompt empty-state CTA to /prompts/new", () => {
    const filters: ListItemsFilters = {
      type: "prompt",
      search: "draft",
      sort: "updated",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList type="prompt" items={[]} filters={filters} />,
    );

    expect(html).toContain("No prompts yet");
    expect(html).toContain("Create Prompt");
    expect(html).toContain('href="/prompts/new"');
  });

  it("accepts filters and renders the skill empty-state CTA to /skills/new", () => {
    const filters: ListItemsFilters = {
      type: "skill",
      isFavorite: true,
      sort: "used",
      limit: 50,
    };

    const html = renderToStaticMarkup(
      <LibraryList type="skill" items={[]} filters={filters} />,
    );

    expect(html).toContain("No skills yet");
    expect(html).toContain("Create Skill");
    expect(html).toContain('href="/skills/new"');
  });
});
