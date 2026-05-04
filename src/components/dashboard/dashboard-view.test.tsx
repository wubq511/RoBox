import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { StoredItem } from "@/server/db/types";

import { DashboardView } from "./dashboard-view";

function createStoredItem(overrides: Partial<StoredItem>): StoredItem {
  return {
    id: "item-1",
    userId: "user-1",
    type: "prompt",
    title: "",
    summary: "",
    content: "Raw content",
    category: "Other",
    tags: [],
    sourceUrl: "",
    isFavorite: false,
    isAnalyzed: false,
    usageCount: 0,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
    ...overrides,
  };
}

describe("DashboardView", () => {
  it("renders real summary counts and quick-add links", () => {
    const html = renderToStaticMarkup(
      <DashboardView
        snapshot={{
          counts: {
            total: 6,
            prompts: 4,
            skills: 2,
            pending: 3,
          },
          recent: [],
          favorites: [],
          pending: [],
        }}
      />,
    );

    expect(html).toContain("6");
    expect(html).toContain("4");
    expect(html).toContain("2");
    expect(html).toContain("3");
    expect(html).toContain('href="/prompts/new"');
    expect(html).toContain('href="/skills/new"');
    expect(html).toContain("新建 Prompt");
    expect(html).toContain("新建 Skill");
  });

  it("renders duplicate empty labels as distinct list entries", () => {
    const first = createStoredItem({ id: "prompt-1" });
    const second = createStoredItem({ id: "prompt-2" });
    const html = renderToStaticMarkup(
      <DashboardView
        snapshot={{
          counts: {
            total: 2,
            prompts: 2,
            skills: 0,
            pending: 2,
          },
          recent: [],
          favorites: [first, second],
          pending: [first, second],
        }}
      />,
    );

    expect(html).toContain('href="/prompts/prompt-1"');
    expect(html).toContain('href="/prompts/prompt-2"');
  });
});
