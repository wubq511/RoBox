import { describe, expect, it } from "vitest";

import { parseItemFormData, parseTagsInput, parseVariablesInput } from "./forms";

describe("item form helpers", () => {
  it("deduplicates and trims tags input", () => {
    expect(parseTagsInput("ts,  agent, ts , ")).toEqual(["ts", "agent"]);
  });

  it("returns an empty array for blank variables input", () => {
    expect(parseVariablesInput("")).toEqual([]);
  });

  it("parses prompt form data into editor input", () => {
    const formData = new FormData();

    formData.set("title", "  Prompt title  ");
    formData.set("summary", " Summary ");
    formData.set("content", "Write a better prompt");
    formData.set("category", "Coding");
    formData.set("tags", "ts,  agent, ts , ");
    formData.set("sourceUrl", "https://example.com/prompt");
    formData.set(
      "variables",
      JSON.stringify([
        {
          name: "language",
          description: "Target language",
          defaultValue: "TypeScript",
          required: true,
          sortOrder: 0,
        },
      ]),
    );

    expect(parseItemFormData(formData, "prompt")).toEqual({
      type: "prompt",
      title: "Prompt title",
      summary: "Summary",
      content: "Write a better prompt",
      category: "Coding",
      tags: ["ts", "agent"],
      sourceUrl: "https://example.com/prompt",
      variables: [
        {
          name: "language",
          description: "Target language",
          defaultValue: "TypeScript",
          required: true,
          sortOrder: 0,
        },
      ],
    });
  });
});
