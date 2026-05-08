import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { config, middleware } from "../middleware";

describe("middleware", () => {
  it("refreshes the Supabase SSR session for matched requests", async () => {
    const request = new NextRequest("https://robox.example/dashboard");
    const response = new Response(null, { status: 204 });
    mocks.updateSession.mockResolvedValue(response);

    await expect(middleware(request)).resolves.toBe(response);
    expect(mocks.updateSession).toHaveBeenCalledWith(request);
  });

  it("only refreshes sessions on protected workspace pages", () => {
    expect(config.matcher).toEqual([
      "/dashboard/:path*",
      "/prompts/:path*",
      "/skills/:path*",
      "/tools/:path*",
      "/favorites/:path*",
      "/settings/:path*",
    ]);
  });
});
