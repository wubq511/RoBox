import { describe, expect, it } from "vitest";

import { isEmailAllowed, parseAllowedEmails } from "./allowlist";

describe("allowlist helpers", () => {
  it("normalizes whitespace and casing", () => {
    expect(parseAllowedEmails(" Robert@Example.com , foo@bar.com ")).toEqual([
      "robert@example.com",
      "foo@bar.com",
    ]);
  });

  it("matches emails case-insensitively", () => {
    expect(isEmailAllowed("Robert@Example.com", ["robert@example.com"])).toBe(
      true,
    );
  });
});
