import { describe, expect, it } from "vitest";

import {
  buildLibraryHref,
  parseFavoritesSearchParams,
  parseLibrarySearchParams,
} from "./query-state";

describe("library query state", () => {
  it("normalizes prompt list query params", () => {
    expect(
      parseLibrarySearchParams(
        {
          search: "  refactor prompt  ",
          category: "Coding",
          tag: "ts",
          favorite: "1",
          sort: "used",
        },
        "prompt",
      ),
    ).toEqual({
      type: "prompt",
      search: "refactor prompt",
      category: "Coding",
      tag: "ts",
      isFavorite: true,
      sort: "used",
      limit: 50,
    });
  });

  it("builds skill hrefs with search param and updated sort", () => {
    expect(
      buildLibraryHref("skill", {
        search: "agent",
        sort: "updated",
      }),
    ).toBe("/skills?search=agent&sort=updated");
  });

  it("builds stable list hrefs without empty params", () => {
    expect(
      buildLibraryHref("prompt", {
        search: "  prompt ideas  ",
        category: undefined,
        tag: "",
        sort: "used",
        limit: 50,
      }),
    ).toBe("/prompts?search=prompt+ideas&sort=used");
  });

  it("does not add implicit updated sort when omitted", () => {
    expect(
      buildLibraryHref("prompt", {
        search: "abc",
      }),
    ).toBe("/prompts?search=abc");
  });

  it("normalizes favorite list query params", () => {
    expect(
      parseFavoritesSearchParams({
        search: "  cli tool  ",
        type: "tool",
        sort: "used",
      }),
    ).toEqual({
      type: "tool",
      search: "cli tool",
      isFavorite: true,
      sort: "used",
      limit: 100,
    });
  });
});
