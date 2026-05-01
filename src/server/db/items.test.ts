import { describe, expect, it } from "vitest";

import {
  buildItemInsert,
  buildItemUpdate,
  sanitizeListItemsInput,
} from "./items";

describe("item repository helpers", () => {
  it("defaults missing category to Other", () => {
    expect(
      buildItemInsert("user-1", {
        type: "prompt",
        content: "raw prompt",
        tags: [],
      }).category,
    ).toBe("Other");
  });

  it("does not send undefined fields in updates", () => {
    expect(buildItemUpdate({ title: "New title", summary: undefined })).toEqual({
      title: "New title",
    });
  });

  it("normalizes list filters", () => {
    expect(
      sanitizeListItemsInput({
        search: "  prompt  ",
      }),
    ).toMatchObject({
      search: "prompt",
      limit: 50,
    });
  });
});
