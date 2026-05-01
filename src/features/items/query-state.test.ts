import { describe, expect, it } from "vitest";

import {
  buildLibraryHref,
  parseLibrarySearchParams,
} from "./query-state";

describe("library query state", () => {
  it("normalizes prompt list query params", () => {
    expect(
      parseLibrarySearchParams("/prompts", {
        search: "  prompt ideas  ",
        category: "Writing",
        tag: "  react  ",
        sort: "used",
        limit: "200",
      }),
    ).toEqual({
      type: "prompt",
      search: "prompt ideas",
      category: "Writing",
      tag: "react",
      sort: "used",
      limit: 100,
    });
  });

  it("builds stable list hrefs without empty params", () => {
    expect(
      buildLibraryHref("/prompts", {
        type: "prompt",
        search: "  prompt ideas  ",
        category: undefined,
        tag: "",
        sort: "recent",
        limit: 50,
      }),
    ).toBe("/prompts?q=prompt+ideas");
  });
});
