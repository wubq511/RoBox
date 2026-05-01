import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ItemDetail } from "@/server/db/types";

import { ItemDetailView } from "./item-detail-view";

describe("ItemDetailView", () => {
  it("renders prompt variables, copy, delete, and back actions from returnPath", () => {
    const item: ItemDetail = {
      id: "prompt-1",
      userId: "user-1",
      type: "prompt",
      title: "Prompt title",
      summary: "Prompt summary",
      content: "Draft for {{topic}} in {{format}}",
      category: "Writing",
      tags: ["drafting", "prompt"],
      sourceUrl: "",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 3,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [
        {
          id: "var-1",
          itemId: "prompt-1",
          name: "topic",
          description: "Main topic",
          defaultValue: "",
          required: true,
          sortOrder: 0,
          createdAt: "2026-05-01T12:00:00.000Z",
        },
        {
          id: "var-2",
          itemId: "prompt-1",
          name: "format",
          description: "Target format",
          defaultValue: "Markdown",
          required: false,
          sortOrder: 1,
          createdAt: "2026-05-01T12:00:00.000Z",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <ItemDetailView item={item} returnPath="/prompts" />,
    );

    expect(html).toContain("Variables");
    expect(html).toContain("topic");
    expect(html).toContain("format");
    expect(html).toContain("Copy raw");
    expect(html).toContain("Delete");
    expect(html).toContain('href="/prompts"');
  });
});
