import { describe, expect, it } from "vitest";

import { aiSearchRequestSchema } from "./ai-search";

describe("aiSearchRequestSchema", () => {
  it("trims query text and defaults type to auto", () => {
    expect(
      aiSearchRequestSchema.parse({
        query: "  帮我找一个做论文结构化阅读的工具  ",
      }),
    ).toEqual({
      query: "帮我找一个做论文结构化阅读的工具",
      type: "auto",
    });
  });

  it("rejects short queries and unknown types", () => {
    expect(() =>
      aiSearchRequestSchema.parse({
        query: "a",
        type: "workflow",
      }),
    ).toThrow();
  });
});
