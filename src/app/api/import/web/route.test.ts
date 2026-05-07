import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createWebToolImportMock,
  revalidatePathMock,
  getOptionalAppUserMock,
  checkRateLimitMock,
  getAppOriginMock,
  ensureDefaultCategoriesMock,
  getUserCategoryNamesMock,
} = vi.hoisted(() => ({
  createWebToolImportMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  getOptionalAppUserMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getAppOriginMock: vi.fn(),
  ensureDefaultCategoriesMock: vi.fn(),
  getUserCategoryNamesMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/import/web", () => ({
  createWebToolImport: createWebToolImportMock,
}));

vi.mock("@/server/auth/session", () => ({
  getOptionalAppUser: getOptionalAppUserMock,
}));

vi.mock("@/server/db/categories", () => ({
  ensureDefaultCategories: ensureDefaultCategoriesMock,
  getUserCategoryNames: getUserCategoryNamesMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/env", () => ({
  getAppOrigin: getAppOriginMock,
}));

import { POST } from "./route";

const defaultCategories = ["Writing", "Coding", "Research", "Design", "Study", "Agent", "Content", "Other"];

describe("POST /api/import/web", () => {
  beforeEach(() => {
    createWebToolImportMock.mockReset();
    revalidatePathMock.mockReset();
    getOptionalAppUserMock.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    checkRateLimitMock.mockReturnValue({ allowed: true, ip: "127.0.0.1" });
    getAppOriginMock.mockReturnValue("http://localhost:3000");
    ensureDefaultCategoriesMock.mockResolvedValue(undefined);
    getUserCategoryNamesMock.mockResolvedValue(defaultCategories);
  });

  it("imports a public website as a tool and revalidates tool pages", async () => {
    createWebToolImportMock.mockResolvedValue({
      item: {
        id: "tool-1",
        type: "tool",
        title: "Raycast",
      },
      pageUrl: "https://raycast.com/",
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/web", {
        method: "POST",
        body: JSON.stringify({ url: "https://raycast.com" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(getUserCategoryNamesMock).toHaveBeenCalledWith("user-1", "tool");
    expect(createWebToolImportMock).toHaveBeenCalledWith({
      url: "https://raycast.com",
      categories: defaultCategories,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/tools");
    expect(revalidatePathMock).toHaveBeenCalledWith("/tools/tool-1");
  });

  it("returns 401 when user is not authenticated", async () => {
    getOptionalAppUserMock.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/web", {
        method: "POST",
        body: JSON.stringify({ url: "https://raycast.com" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(createWebToolImportMock).not.toHaveBeenCalled();
  });

  it("returns 403 for cross-origin requests", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/web", {
        method: "POST",
        body: JSON.stringify({ url: "https://raycast.com" }),
        headers: { origin: "https://evil.example.com" },
      }),
    );

    expect(response.status).toBe(403);
  });
});
