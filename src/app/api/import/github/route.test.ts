import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createGithubSkillImportMock,
  revalidatePathMock,
  getOptionalAppUserMock,
  checkRateLimitMock,
  getAppOriginMock,
  ensureDefaultCategoriesMock,
  getUserCategoryNamesMock,
} = vi.hoisted(() => ({
  createGithubSkillImportMock: vi.fn(),
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

vi.mock("@/server/import/github", () => ({
  createGithubSkillImport: createGithubSkillImportMock,
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

describe("POST /api/import/github", () => {
  beforeEach(() => {
    createGithubSkillImportMock.mockReset();
    revalidatePathMock.mockReset();
    getOptionalAppUserMock.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    checkRateLimitMock.mockReturnValue({ allowed: true, ip: "127.0.0.1" });
    getAppOriginMock.mockReturnValue("http://localhost:3000");
    ensureDefaultCategoriesMock.mockResolvedValue(undefined);
    getUserCategoryNamesMock.mockResolvedValue(defaultCategories);
  });

  it("returns 401 when user is not authenticated", async () => {
    getOptionalAppUserMock.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/tw93/Waza" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(createGithubSkillImportMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimitMock.mockReturnValue({ allowed: false, ip: "127.0.0.1" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/tw93/Waza" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(createGithubSkillImportMock).not.toHaveBeenCalled();
  });

  it("imports a GitHub skill and revalidates workspace pages", async () => {
    createGithubSkillImportMock.mockResolvedValue({
      item: {
        id: "skill-1",
        type: "skill",
        title: "Waza",
      },
      readmeUrl: "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/tw93/Waza" }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      item: {
        id: "skill-1",
        title: "Waza",
      },
      readmeUrl: "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
    });
    expect(response.status).toBe(201);
    expect(createGithubSkillImportMock).toHaveBeenCalledWith({
      url: "https://github.com/tw93/Waza",
      type: "skill",
      categories: defaultCategories,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills");
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills/skill-1");
  });

  it("imports a GitHub tool and revalidates tool pages", async () => {
    createGithubSkillImportMock.mockResolvedValue({
      item: {
        id: "tool-1",
        type: "tool",
        title: "Next.js",
      },
      readmeUrl: "https://raw.githubusercontent.com/vercel/next.js/HEAD/README.md",
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({
          url: "https://github.com/vercel/next.js",
          type: "tool",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(getUserCategoryNamesMock).toHaveBeenCalledWith("user-1", "tool");
    expect(createGithubSkillImportMock).toHaveBeenCalledWith({
      url: "https://github.com/vercel/next.js",
      type: "tool",
      categories: defaultCategories,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/tools");
    expect(revalidatePathMock).toHaveBeenCalledWith("/tools/tool-1");
  });

  it("returns a recoverable error for invalid GitHub URLs", async () => {
    createGithubSkillImportMock.mockRejectedValue(
      Object.assign(
        new Error("Only github.com and raw.githubusercontent.com URLs are allowed."),
        { statusCode: 400 },
      ),
    );

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/repo" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns 422 when URL exceeds max length", async () => {
    const longUrl = "https://github.com/user/repo/" + "a".repeat(2100);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({ url: longUrl }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("returns 403 for cross-origin requests", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/import/github", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/tw93/Waza" }),
        headers: { origin: "https://evil.example.com" },
      }),
    );

    expect(response.status).toBe(403);
  });
});
