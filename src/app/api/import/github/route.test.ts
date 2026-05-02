import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createGithubSkillImportMock, revalidatePathMock } = vi.hoisted(() => ({
  createGithubSkillImportMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/import/github", () => ({
  createGithubSkillImport: createGithubSkillImportMock,
}));

import { POST } from "./route";

describe("POST /api/import/github", () => {
  beforeEach(() => {
    createGithubSkillImportMock.mockReset();
    revalidatePathMock.mockReset();
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
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills");
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills/skill-1");
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

    await expect(response.json()).resolves.toEqual({
      error: "Only github.com and raw.githubusercontent.com URLs are allowed.",
    });
    expect(response.status).toBe(400);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
