import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { AiSearchResponse } from "@/lib/schema/ai-search";

import {
  AiSearchEmptyState,
  AiSearchErrorMessage,
  AiSearchLoadingState,
  AiSearchResults,
  AiSearchStartState,
  AiSearchView,
} from "./ai-search-view";

const response: AiSearchResponse = {
  query: "帮我找论文阅读流程",
  selectedType: "auto",
  inferredTypes: ["prompt", "skill", "tool"],
  scannedCount: 3,
  candidateLimitReached: true,
  groups: [
    {
      type: "prompt",
      results: [
        {
          score: 96,
          reason: "能把论文拆成结构化步骤。",
          useCase: "阅读 PDF 并输出学习笔记。",
          item: {
            id: "prompt-1",
            type: "prompt",
            title: "论文阅读 Prompt",
            summary: "用于结构化阅读论文。",
            category: "Research",
            tags: ["论文", "阅读"],
            sourceUrl: "",
            isFavorite: true,
            isAnalyzed: true,
            usageCount: 4,
            updatedAt: "2026-05-01T12:00:00.000Z",
            contentPreview: "请阅读论文并生成笔记。",
          },
        },
      ],
    },
    {
      type: "skill",
      results: [],
    },
    {
      type: "tool",
      results: [],
    },
  ],
};

describe("AiSearchView", () => {
  it("renders the initial AI search form", () => {
    const html = renderToStaticMarkup(<AiSearchView />);

    expect(html).toContain("AI检索");
    expect(html).toContain('name="query"');
    expect(html).toContain("自动");
    expect(html).toContain("Prompt");
    expect(html).toContain("Skill");
    expect(html).toContain("Tool");
    expect(html).toContain("等待检索");
    expect(html).toContain("不保存历史");
  });

  it("renders grouped results with match metadata and detail links", () => {
    const html = renderToStaticMarkup(<AiSearchResults response={response} />);

    expect(html).toContain("1 个结果");
    expect(html).toContain("已扫描 3 个");
    expect(html).toContain("范围已截断");
    expect(html).toContain("Prompt");
    expect(html).toContain("论文阅读 Prompt");
    expect(html).toContain("匹配度");
    expect(html).toContain("96");
    expect(html).toContain("原文片段");
    expect(html).toContain("能把论文拆成结构化步骤。");
    expect(html).toContain("阅读 PDF 并输出学习笔记。");
    expect(html).toContain('href="/prompts/prompt-1"');
    expect(html).toContain("本类暂无匹配");
  });

  it("renders loading, error, and empty states", () => {
    expect(renderToStaticMarkup(<AiSearchLoadingState />)).toContain("正在检索");
    expect(renderToStaticMarkup(<AiSearchErrorMessage message="DeepSeek 请求超时" />)).toContain("DeepSeek 请求超时");
    expect(renderToStaticMarkup(<AiSearchEmptyState />)).toContain("没有匹配结果");
    expect(renderToStaticMarkup(<AiSearchStartState />)).toContain("等待检索");
  });
});
