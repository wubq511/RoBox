import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { config, proxy } from "./proxy";

describe("proxy", () => {
  it("refreshes the Supabase SSR session for matched requests", async () => {
    const request = new NextRequest("https://robox.example/dashboard");
    const response = new Response(null, { status: 204 });
    mocks.updateSession.mockResolvedValue(response);

    await expect(proxy(request)).resolves.toBe(response);
    expect(mocks.updateSession).toHaveBeenCalledWith(request);
  });

  it("excludes static assets from the proxy matcher", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]);
  });
});
