import { describe, expect, it } from "vitest";

import { metadata } from "./layout";

describe("root metadata", () => {
  it("uses Chinese app copy for the browser metadata", () => {
    expect(metadata.description).toBe("管理你的 Prompt、Skill 与 Tool。");
  });
});
