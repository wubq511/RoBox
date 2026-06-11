import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  runAiSearchMock,
  getOptionalAppUserMock,
  checkRateLimitMock,
  getAppOriginMock,
} = vi.hoisted(() => ({
  runAiSearchMock: vi.fn(),
  getOptionalAppUserMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getAppOriginMock: vi.fn(),
}));

vi.mock("@/server/search/service", () => ({
  runAiSearch: runAiSearchMock,
}));

vi.mock("@/server/auth/session", () => ({
  getOptionalAppUser: getOptionalAppUserMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/env", () => ({
  getAppOrigin: getAppOriginMock,
}));

import { POST } from "./route";

describe("POST /api/search/ai", () => {
  beforeEach(() => {
    runAiSearchMock.mockReset();
    getOptionalAppUserMock.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    checkRateLimitMock.mockReturnValue({ allowed: true, ip: "127.0.0.1" });
    getAppOriginMock.mockReturnValue("http://localhost:3000");
  });

  it("returns 401 when user is not authenticated", async () => {
    getOptionalAppUserMock.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/ai", {
        method: "POST",
        body: JSON.stringify({ query: "paper workflow" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(runAiSearchMock).not.toHaveBeenCalled();
  });

  it("returns 403 for cross-origin requests", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/ai", {
        method: "POST",
        headers: { origin: "https://evil.example.com" },
        body: JSON.stringify({ query: "paper workflow" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(runAiSearchMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, ip: "127.0.0.1" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/ai", {
        method: "POST",
        body: JSON.stringify({ query: "paper workflow" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(runAiSearchMock).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid requests", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/ai", {
        method: "POST",
        body: JSON.stringify({ query: "a", type: "workflow" }),
      }),
    );

    expect(response.status).toBe(422);
    expect(runAiSearchMock).not.toHaveBeenCalled();
  });

  it("runs AI search for the authenticated user without revalidation", async () => {
    runAiSearchMock.mockResolvedValue({
      query: "paper workflow",
      selectedType: "auto",
      inferredTypes: ["prompt"],
      scannedCount: 1,
      candidateLimitReached: false,
      groups: [],
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/ai", {
        method: "POST",
        body: JSON.stringify({ query: "paper workflow", type: "auto" }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      query: "paper workflow",
      selectedType: "auto",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(runAiSearchMock).toHaveBeenCalledWith(
      { query: "paper workflow", type: "auto" },
      { userId: "user-1" },
    );
  });

  it("returns safe error details when DeepSeek search fails", async () => {
    const error = Object.assign(new Error("raw upstream error"), {
      code: "deepseek_timeout",
      statusCode: 504,
      safeMessage: "DeepSeek 请求超时，请稍后重试。",
    });
    runAiSearchMock.mockRejectedValue(error);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/ai", {
        method: "POST",
        body: JSON.stringify({ query: "paper workflow" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "DeepSeek 请求超时，请稍后重试。",
      code: "deepseek_timeout",
    });
    expect(response.status).toBe(504);
  });
});
