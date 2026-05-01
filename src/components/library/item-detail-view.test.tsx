import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { LibraryItem } from "@/features/items/types";

import { ItemDetailView } from "./item-detail-view";

describe("ItemDetailView", () => {
  it("renders prompt variables and a raw copy action", () => {
    const item: LibraryItem = {
      id: "prompt-1",
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
      updatedAt: "2026-05-01 20:00",
      variables: [
        {
          name: "topic",
          description: "Main topic",
          defaultValue: "",
          required: true,
        },
        {
          name: "format",
          description: "Target format",
          defaultValue: "Markdown",
          required: false,
        },
      ],
    };

    const html = renderToStaticMarkup(
      <ItemDetailView
        item={item}
        revalidatePaths={["/dashboard", "/prompts", "/prompts/prompt-1"]}
      />,
    );

    expect(html).toContain("Variables");
    expect(html).toContain("topic");
    expect(html).toContain("format");
    expect(html).toContain("Copy raw");
  });
});
