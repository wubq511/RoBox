import { describe, expect, it } from "vitest";

import { mapItemRow, mapPromptVariableRow } from "./mappers";

describe("database mappers", () => {
  it("maps snake_case item rows to app shape", () => {
    const item = mapItemRow({
      id: "item-1",
      user_id: "user-1",
      type: "prompt",
      title: "Prompt A",
      summary: "Summary",
      content: "raw",
      category: "Coding",
      tags: ["ts"],
      source_url: null,
      is_favorite: true,
      is_analyzed: false,
      usage_count: 3,
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: "2026-05-01T00:00:00.000Z",
    });

    expect(item.isFavorite).toBe(true);
    expect(item.isAnalyzed).toBe(false);
    expect(item.sourceUrl).toBe("");
  });

  it("maps prompt variable rows to camelCase", () => {
    expect(
      mapPromptVariableRow({
        id: "var-1",
        item_id: "item-1",
        name: "topic",
        description: "desc",
        default_value: "ts",
        required: true,
        sort_order: 1,
        created_at: "2026-05-01T00:00:00.000Z",
      }).defaultValue,
    ).toBe("ts");
  });
});
