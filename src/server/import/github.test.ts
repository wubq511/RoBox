import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createItemMock,
  requestDeepSeekAnalysisMock,
  updateItemMock,
} = vi.hoisted(() => ({
  createItemMock: vi.fn(),
  requestDeepSeekAnalysisMock: vi.fn(),
  updateItemMock: vi.fn(),
}));

vi.mock("@/server/db/items", () => ({
  createItem: createItemMock,
  updateItem: updateItemMock,
}));

vi.mock("@/server/analyze/deepseek", () => ({
  requestDeepSeekAnalysis: requestDeepSeekAnalysisMock,
}));

import {
  createGithubSkillImport,
  fetchGithubReadme,
  resolveGithubSkillUrl,
} from "./github";

describe("GitHub skill import helpers", () => {
  beforeEach(() => {
    createItemMock.mockReset();
    requestDeepSeekAnalysisMock.mockReset();
    updateItemMock.mockReset();
  });

  it("resolves a GitHub repository URL to README candidates", () => {
    expect(resolveGithubSkillUrl(" https://github.com/tw93/Waza ")).toMatchObject({
      originalUrl: "https://github.com/tw93/Waza",
      repositoryName: "tw93/Waza",
      repositoryUrl: "https://github.com/tw93/Waza",
      readmeCandidates: [
        "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
        "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.mdx",
        "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.txt",
        "https://raw.githubusercontent.com/tw93/Waza/HEAD/README",
        "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
        "https://raw.githubusercontent.com/tw93/Waza/master/README.md",
      ],
    });
  });

  it("converts a GitHub README blob URL to a raw README URL", () => {
    expect(
      resolveGithubSkillUrl("https://github.com/tw93/Waza/blob/main/README.md"),
    ).toMatchObject({
      originalUrl: "https://github.com/tw93/Waza/blob/main/README.md",
      repositoryUrl: "https://github.com/tw93/Waza",
      readmeCandidates: [
        "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
      ],
    });
  });

  it("accepts a raw GitHub README URL and keeps the repository as the source", () => {
    expect(
      resolveGithubSkillUrl(
        "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
      ),
    ).toMatchObject({
      originalUrl: "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
      repositoryUrl: "https://github.com/tw93/Waza",
      readmeCandidates: [
        "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
      ],
    });
  });

  it("rejects URLs outside GitHub and raw GitHub", () => {
    expect(() => resolveGithubSkillUrl("https://example.com/tw93/Waza")).toThrow(
      "Only github.com and raw.githubusercontent.com URLs are allowed.",
    );
  });

  it("tries README candidates until GitHub returns a readable body", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("Not found", { status: 404 }))
      .mockResolvedValueOnce(new Response("# Waza\n\nA useful skill.", { status: 200 }));

    await expect(
      fetchGithubReadme(
        {
          originalUrl: "https://github.com/tw93/Waza",
          repositoryName: "tw93/Waza",
          repositoryUrl: "https://github.com/tw93/Waza",
          readmeCandidates: [
            "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
            "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.mdx",
          ],
        },
        { fetcher },
      ),
    ).resolves.toEqual({
      content: "# Waza\n\nA useful skill.",
      readmeUrl: "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.mdx",
    });

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "RoBox GitHub Import",
        }),
      }),
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("saves the submitted link as skill content and analyzes README context", async () => {
    const userCategories = ["Writing", "Coding", "Agent", "Other"];
    const createdItem = {
      id: "skill-1",
      type: "skill",
      title: "tw93/Waza",
      summary: "",
      content: "https://github.com/tw93/Waza",
      category: "Writing",
      tags: ["GitHub"],
      sourceUrl: "https://github.com/tw93/Waza",
      isAnalyzed: false,
    };
    const analyzedItem = {
      ...createdItem,
      title: "Waza",
      summary: "汇总常用 AI 编程工作流的 Skill。",
      category: "Agent",
      tags: ["AI", "Skill"],
      isAnalyzed: true,
    };

    createItemMock.mockResolvedValue(createdItem);
    requestDeepSeekAnalysisMock.mockResolvedValue({
      title: "Waza",
      summary: "汇总常用 AI 编程工作流的 Skill。",
      category: "Agent",
      tags: ["AI", "Skill"],
      variables: [],
    });
    updateItemMock.mockResolvedValue(analyzedItem);

    const fetcher = vi.fn().mockResolvedValue(
      new Response("# Waza\n\nUse this for AI workflows.", {
        status: 200,
      }),
    );

    await expect(
      createGithubSkillImport(
        { url: "https://github.com/tw93/Waza", categories: userCategories },
        { fetcher },
      ),
    ).resolves.toMatchObject({
      item: analyzedItem,
      readmeUrl: "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
    });

    expect(createItemMock).toHaveBeenCalledWith({
      type: "skill",
      title: "tw93/Waza",
      summary: "",
      content: "https://github.com/tw93/Waza",
      category: "Writing",
      tags: ["GitHub"],
      sourceUrl: "https://github.com/tw93/Waza",
    });
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "skill",
        categories: userCategories,
        content: expect.stringContaining("# Waza"),
      }),
    );
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("GitHub source: https://github.com/tw93/Waza"),
      }),
    );
    expect(updateItemMock).toHaveBeenCalledWith("skill-1", {
      title: "Waza",
      summary: "汇总常用 AI 编程工作流的 Skill。",
      category: "Agent",
      tags: ["AI", "Skill"],
      isAnalyzed: true,
    });
  });

  it("keeps the imported skill when README analysis fails", async () => {
    const createdItem = {
      id: "skill-1",
      type: "skill",
      title: "tw93/Waza",
      summary: "",
      content: "https://github.com/tw93/Waza",
      category: "Writing",
      tags: ["GitHub"],
      sourceUrl: "https://github.com/tw93/Waza",
      isAnalyzed: false,
    };

    createItemMock.mockResolvedValue(createdItem);
    requestDeepSeekAnalysisMock.mockRejectedValue(new Error("Missing API key."));

    const fetcher = vi.fn().mockResolvedValue(
      new Response("# Waza\n\nUse this for AI workflows.", {
        status: 200,
      }),
    );

    await expect(
      createGithubSkillImport(
        { url: "https://github.com/tw93/Waza", categories: ["Writing", "Coding", "Other"] },
        { fetcher },
      ),
    ).resolves.toEqual({
      item: createdItem,
      readmeUrl: "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
      warning: "Imported from GitHub, but smart analyze failed: Missing API key.",
    });
    expect(updateItemMock).not.toHaveBeenCalled();
  });
});
