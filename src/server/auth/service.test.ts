import { describe, expect, it } from "vitest";

import { buildAuthRedirectUrl, sanitizeNextPath } from "./service";

describe("auth service helpers", () => {
  it("builds the confirm callback URL off the current origin", () => {
    expect(buildAuthRedirectUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/confirm?next=%2Fdashboard",
    );
  });

  it("allows only same-app relative next paths", () => {
    expect(sanitizeNextPath("/skills")).toBe("/skills");
    expect(sanitizeNextPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("settings")).toBe("/dashboard");
  });
});
