import { describe, expect, it } from "vitest";

import {
  copyActionSchema,
  createItemInputSchema,
  itemCategorySchema,
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
});
