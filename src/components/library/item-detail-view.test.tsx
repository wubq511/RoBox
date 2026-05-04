import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ItemDetail } from "@/server/db/types";

vi.mock("./analyze-button", () => ({
  AnalyzeButton: ({ itemId }: { itemId: string }) => (
    <button data-testid="analyze" data-item-id={itemId} />
  ),
}));

vi.mock("./copy-raw-button", () => ({
  CopyRawButton: ({ content }: { content: string }) => (
    <button data-testid="copy-raw" data-content={content} />
  ),
}));

vi.mock("./delete-item-button", () => ({
  DeleteItemButton: ({ itemId }: { itemId: string }) => (
    <button data-testid="delete" data-item-id={itemId} />
  ),
}));

vi.mock("./favorite-toggle-button", () => ({
  FavoriteToggleButton: ({ itemId }: { itemId: string }) => (
    <button data-testid="favorite-toggle" data-item-id={itemId} />
  ),
}));

vi.mock("./prompt-final-panel", () => ({
  PromptFinalPanel: () => <div data-testid="prompt-final-panel" />,
}));

import { ItemDetailView } from "./item-detail-view";

describe("ItemDetailView", () => {
  it("renders prompt variables, copy, delete, and back actions from returnPath", () => {
    const item: ItemDetail = {
      id: "prompt-1",
      userId: "user-1",
      type: "prompt",
      title: "Prompt title",
      summary: "Prompt summary",
      content: "Draft for {{topic}} in {{format}}",
      category: "Writing",
      tags: ["drafting", "prompt"],
      sourceUrl: "",
      isFavorite: false,
      isAnalyzed: false,
      usageCount: 3,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [
        {
          id: "var-1",
          itemId: "prompt-1",
          name: "topic",
          description: "Main topic",
          defaultValue: "",
          required: true,
          sortOrder: 0,
          createdAt: "2026-05-01T12:00:00.000Z",
        },
        {
          id: "var-2",
          itemId: "prompt-1",
          name: "format",
          description: "Target format",
          defaultValue: "Markdown",
          required: false,
          sortOrder: 1,
          createdAt: "2026-05-01T12:00:00.000Z",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <ItemDetailView item={item} returnPath="/prompts" />,
    );

    expect(html).toContain("topic");
    expect(html).toContain("format");
    expect(html).toContain('href="/prompts"');
    expect(html).toContain('href="/prompts/prompt-1/edit"');
  });

  it("renders imported GitHub skill source and copies source_url instead of content", () => {
    const item: ItemDetail = {
      id: "skill-1",
      userId: "user-1",
      type: "skill",
      title: "Skill title",
      summary: "Skill summary",
      content: "https://github.com/example/repo/blob/main/README.md",
      category: "Agent",
      tags: ["agent"],
      sourceUrl: "https://github.com/example/repo",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 3,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    const html = renderToStaticMarkup(
      <ItemDetailView item={item} returnPath="/skills" />,
    );

    expect(html).toContain("来源");
    expect(html).toContain("https://github.com/example/repo");
    expect(html).toContain("安装/加载提示词");
    expect(html).toContain("请你安装/加载这个skill");
    expect(html).toContain('href="/skills/skill-1/edit"');
  });

  it("keeps manual skills bound to raw content for copy", () => {
    const item: ItemDetail = {
      id: "skill-1",
      userId: "user-1",
      type: "skill",
      title: "Skill title",
      summary: "Skill summary",
      content: "SKILL.md raw body",
      category: "Agent",
      tags: ["agent"],
      sourceUrl: "",
      isFavorite: false,
      isAnalyzed: true,
      usageCount: 3,
      createdAt: "2026-05-01T12:00:00.000Z",
      updatedAt: "2026-05-01 20:00",
      variables: [],
    };

    const html = renderToStaticMarkup(
      <ItemDetailView item={item} returnPath="/skills" />,
    );

    expect(html).toContain("内容");
    expect(html).toContain("SKILL.md raw body");
  });
});
