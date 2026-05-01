import { describe, expect, it } from "vitest";

import {
  copyActionSchema,
  createItemInputSchema,
  itemEditorInputSchema,
  itemCategorySchema,
  listItemsFiltersSchema,
} from "./items";

describe("item schemas", () => {
  it("accepts only phase 2 categories", () => {
    expect(itemCategorySchema.parse("Coding")).toBe("Coding");
    expect(() => itemCategorySchema.parse("Workflow")).toThrow();
  });

  it("requires raw content when creating an item", () => {
    expect(() =>
      createItemInputSchema.parse({ type: "prompt", content: "" }),
    ).toThrow();
  });

  it("accepts only supported copy actions", () => {
    expect(copyActionSchema.parse("copy_raw")).toBe("copy_raw");
    expect(() => copyActionSchema.parse("copy_preview")).toThrow();
  });

  it("supports tag filters and used sort with default limit", () => {
    expect(
      listItemsFiltersSchema.parse({
        type: "prompt",
        tag: "react",
        sort: "used",
      }),
    ).toEqual({
      type: "prompt",
      tag: "react",
      sort: "used",
      limit: 50,
    });
  });

  it("defaults sort to updated", () => {
    expect(
      listItemsFiltersSchema.parse({
        type: "skill",
      }),
    ).toEqual({
      type: "skill",
      sort: "updated",
      limit: 50,
    });
  });

  it("allows prompt editor input with zero variables", () => {
    expect(
      itemEditorInputSchema.parse({
        type: "prompt",
        content: "Draft prompt",
        variables: [],
      }),
    ).toMatchObject({
      type: "prompt",
      content: "Draft prompt",
      variables: [],
    });
  });
});
