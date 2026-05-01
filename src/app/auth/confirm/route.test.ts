import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  getOptionalAppUser: vi.fn(),
  signOutWorkspaceSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  getServerSupabaseClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      verifyOtp: mocks.verifyOtp,
    },
  })),
}));

vi.mock("@/server/auth/session", () => ({
  getOptionalAppUser: mocks.getOptionalAppUser,
}));

vi.mock("@/server/auth/service", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/auth/service")>(
      "@/server/auth/service",
    );

  return {
    ...actual,
    signOutWorkspaceSession: mocks.signOutWorkspaceSession,
  };
});

import { GET } from "./route";

describe("auth confirm callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges auth codes for a session before redirecting", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getOptionalAppUser.mockResolvedValue({
      id: "user-1",
      email: "robert@local.dev",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/confirm?code=auth-code&next=%2Fskills",
      ),
    );

    const location = new URL(response.headers.get("location")!);

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("auth-code");
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(location.pathname).toBe("/skills");
    expect(location.search).toBe("");
  });

  it("signs out users that pass auth but fail the workspace allowlist", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: null });
    mocks.getOptionalAppUser.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/confirm?token_hash=hash-123&type=magiclink&next=%2Fdashboard",
      ),
    );

    const location = new URL(response.headers.get("location")!);

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      type: "magiclink",
      token_hash: "hash-123",
    });
    expect(mocks.signOutWorkspaceSession).toHaveBeenCalledTimes(1);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("email_not_allowed");
  });

  it("treats failed code exchanges as invalid links", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "bad auth code" },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/confirm?code=bad-code&next=%2Fdashboard",
      ),
    );

    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("invalid_link");
    expect(location.searchParams.get("code")).toBeNull();
  });
});
