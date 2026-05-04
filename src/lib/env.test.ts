import { afterEach, describe, expect, it, vi } from "vitest";

import { getAppOrigin, resetLocalEnvCache } from "./env";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn().mockImplementation(() => {
    throw new Error("no .env.local in test");
  }),
}));

describe("app origin env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetLocalEnvCache();
  });

  it("uses NEXT_PUBLIC_APP_ORIGIN when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ORIGIN", "https://robox.example");
    vi.stubEnv("NODE_ENV", "production");

    expect(getAppOrigin()).toBe("https://robox.example");
  });

  it("keeps the localhost fallback for local development only", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ORIGIN", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("does not silently fall back to localhost in production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ORIGIN", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getAppOrigin()).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_APP_ORIGIN",
    );
  });
});
