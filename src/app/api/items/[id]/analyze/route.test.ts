import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  analyzeStoredItemMock,
  revalidatePathMock,
  getOptionalAppUserMock,
  checkRateLimitMock,
  getAppOriginMock,
} = vi.hoisted(() => ({
  analyzeStoredItemMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  getOptionalAppUserMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getAppOriginMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/analyze/service", () => ({
  analyzeStoredItem: analyzeStoredItemMock,
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

describe("POST /api/items/:id/analyze", () => {
  beforeEach(() => {
    analyzeStoredItemMock.mockReset();
    revalidatePathMock.mockReset();
    getOptionalAppUserMock.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    checkRateLimitMock.mockReturnValue({ allowed: true, ip: "127.0.0.1" });
    getAppOriginMock.mockReturnValue("http://localhost:3000");
  });

  it("returns 401 when user is not authenticated", async () => {
    getOptionalAppUserMock.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/items/prompt-1/analyze", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "prompt-1" }) },
    );

    expect(response.status).toBe(401);
    expect(analyzeStoredItemMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, ip: "127.0.0.1" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/items/prompt-1/analyze", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "prompt-1" }) },
    );

    expect(response.status).toBe(429);
    expect(analyzeStoredItemMock).not.toHaveBeenCalled();
  });

  it("analyzes an item and revalidates the dashboard, collection, and detail pages", async () => {
    analyzeStoredItemMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
      title: "Analyzed prompt",
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/items/prompt-1/analyze", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "prompt-1" }) },
    );

    await expect(response.json()).resolves.toMatchObject({
      item: {
        id: "prompt-1",
        title: "Analyzed prompt",
      },
    });
    expect(response.status).toBe(200);
    expect(analyzeStoredItemMock).toHaveBeenCalledWith("prompt-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts/prompt-1");
  });

  it("returns a recoverable error when analysis fails", async () => {
    analyzeStoredItemMock.mockRejectedValue(new Error("DeepSeek timeout."));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/items/skill-1/analyze", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "skill-1" }) },
    );

    expect(response.status).toBe(422);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns 403 for cross-origin requests", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/items/prompt-1/analyze", {
        method: "POST",
        headers: { origin: "https://evil.example.com" },
      }),
      { params: Promise.resolve({ id: "prompt-1" }) },
    );

    expect(response.status).toBe(403);
  });
});
