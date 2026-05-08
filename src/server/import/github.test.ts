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
      displaySourceUrl: "https://github.com/tw93/Waza",
      sourceKind: "readme-file",
      readmeCandidates: [
        "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
      ],
    });
  });

  it("converts a GitHub SKILL.md blob URL to raw content and a directory source URL", () => {
    expect(
      resolveGithubSkillUrl(
        "https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md",
      ),
    ).toMatchObject({
      originalUrl:
        "https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md",
      repositoryUrl: "https://github.com/anthropics/skills",
      displaySourceUrl:
        "https://github.com/anthropics/skills/blob/main/skills/frontend-design",
      sourceKind: "skill-file",
      readmeCandidates: [
        "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
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
      displaySourceUrl: "https://github.com/tw93/Waza",
      sourceKind: "readme-file",
      readmeCandidates: [
        "https://raw.githubusercontent.com/tw93/Waza/main/README.md",
      ],
    });
  });

  it("converts a raw GitHub SKILL.md URL to a directory source URL", () => {
    expect(
      resolveGithubSkillUrl(
        "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
      ),
    ).toMatchObject({
      originalUrl:
        "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
      repositoryUrl: "https://github.com/anthropics/skills",
      displaySourceUrl:
        "https://github.com/anthropics/skills/blob/main/skills/frontend-design",
      sourceKind: "skill-file",
      readmeCandidates: [
        "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
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
          displaySourceUrl: "https://github.com/tw93/Waza",
          sourceKind: "repository-readme",
          readmeCandidates: [
            "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
            "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.mdx",
          ],
        },
        { fetcher, githubToken: "" },
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
        { fetcher, githubToken: "" },
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

  it("imports a SKILL.md link as a skill using only the frontmatter and intro", async () => {
    const userCategories = ["Design", "Agent", "Other"];
    const sourceUrl =
      "https://github.com/anthropics/skills/blob/main/skills/frontend-design";
    const submittedUrl = `${sourceUrl}/SKILL.md`;
    const createdItem = {
      id: "skill-frontend-design",
      type: "skill",
      title: "anthropics/skills",
      summary: "",
      content: submittedUrl,
      category: "Design",
      tags: ["GitHub"],
      sourceUrl,
      isAnalyzed: false,
    };
    const analyzedItem = {
      ...createdItem,
      title: "frontend-design",
      summary: "用于创建高质量前端界面的 Skill。",
      category: "Design",
      tags: ["前端设计", "UI"],
      isAnalyzed: true,
    };
    const skillBody = [
      "---",
      "name: frontend-design",
      "description: Create distinctive interfaces.",
      "license: Complete terms in LICENSE.txt",
      "---",
      "This skill guides creation of production-grade frontend interfaces.",
      "",
      "## Design Thinking",
      "This later section should not be used for analysis.",
    ].join("\n");

    createItemMock.mockResolvedValue(createdItem);
    requestDeepSeekAnalysisMock.mockResolvedValue({
      title: "frontend-design",
      summary: "用于创建高质量前端界面的 Skill。",
      category: "Design",
      tags: ["前端设计", "UI"],
      variables: [],
    });
    updateItemMock.mockResolvedValue(analyzedItem);

    const fetcher = vi.fn().mockResolvedValue(
      new Response(skillBody, {
        status: 200,
      }),
    );

    await expect(
      createGithubSkillImport(
        { url: submittedUrl, categories: userCategories },
        { fetcher, githubToken: "" },
      ),
    ).resolves.toMatchObject({
      item: analyzedItem,
      readmeUrl:
        "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
      expect.objectContaining({
        headers: expect.objectContaining({
          Range: expect.stringMatching(/^bytes=0-\d+$/),
        }),
      }),
    );
    expect(createItemMock).toHaveBeenCalledWith({
      type: "skill",
      title: "anthropics/skills",
      summary: "",
      content: submittedUrl,
      category: "Design",
      tags: ["GitHub"],
      sourceUrl,
    });
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "skill",
        categories: userCategories,
        content: expect.stringContaining("description: Create distinctive interfaces."),
      }),
    );
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(
          "This skill guides creation of production-grade frontend interfaces.",
        ),
      }),
    );
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.not.stringContaining("This later section should not be used"),
      }),
    );
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining(`GitHub source: ${sourceUrl}`),
      }),
    );
  });

  it("imports a GitHub repository as a tool when requested", async () => {
    const userCategories = ["Coding", "Research", "Other"];
    const createdItem = {
      id: "tool-1",
      type: "tool",
      title: "vercel/next.js",
      summary: "",
      content: "https://github.com/vercel/next.js",
      category: "Coding",
      tags: ["GitHub"],
      sourceUrl: "https://github.com/vercel/next.js",
      isAnalyzed: false,
    };
    const analyzedItem = {
      ...createdItem,
      title: "Next.js",
      summary: "React 全栈框架和部署工具链。",
      tags: ["React", "框架"],
      isAnalyzed: true,
    };

    createItemMock.mockResolvedValue(createdItem);
    requestDeepSeekAnalysisMock.mockResolvedValue({
      title: "Next.js",
      summary: "React 全栈框架和部署工具链。",
      category: "Coding",
      tags: ["React", "框架"],
      variables: [{ name: "ignored", description: "", defaultValue: "", required: true }],
    });
    updateItemMock.mockResolvedValue(analyzedItem);

    const fetcher = vi.fn().mockResolvedValue(
      new Response("# Next.js\n\nThe React Framework.", {
        status: 200,
      }),
    );

    await expect(
      createGithubSkillImport(
        {
          url: "https://github.com/vercel/next.js",
          type: "tool",
          categories: userCategories,
        },
        { fetcher, githubToken: "" },
      ),
    ).resolves.toMatchObject({
      item: analyzedItem,
      readmeUrl: "https://raw.githubusercontent.com/vercel/next.js/HEAD/README.md",
    });

    expect(createItemMock).toHaveBeenCalledWith({
      type: "tool",
      title: "vercel/next.js",
      summary: "",
      content: "https://github.com/vercel/next.js",
      category: "Coding",
      tags: ["GitHub"],
      sourceUrl: "https://github.com/vercel/next.js",
    });
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "tool",
        categories: userCategories,
        content: expect.stringContaining("# Next.js"),
      }),
    );
  });

  it("rejects SKILL.md links for tool imports", async () => {
    await expect(
      createGithubSkillImport(
        {
          url: "https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md",
          type: "tool",
          categories: ["Coding", "Other"],
        },
        { fetcher: vi.fn(), githubToken: "" },
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Tool GitHub import requires a repository or README link.",
    });

    expect(createItemMock).not.toHaveBeenCalled();
    expect(requestDeepSeekAnalysisMock).not.toHaveBeenCalled();
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
        { fetcher, githubToken: "" },
      ),
    ).resolves.toEqual({
      item: createdItem,
      readmeUrl: "https://raw.githubusercontent.com/tw93/Waza/HEAD/README.md",
      warning: "Imported from GitHub, but smart analyze failed: Missing API key.",
    });
    expect(updateItemMock).not.toHaveBeenCalled();
  });
});
