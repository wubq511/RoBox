import { beforeEach, describe, expect, it, vi } from "vitest";

import { analyzeStoredItem } from "./service";

const {
  getItemByIdMock,
  getItemDetailMock,
  replacePromptVariablesMock,
  requestDeepSeekAnalysisMock,
  updateItemMock,
} = vi.hoisted(() => ({
  getItemByIdMock: vi.fn(),
  getItemDetailMock: vi.fn(),
  replacePromptVariablesMock: vi.fn(),
  requestDeepSeekAnalysisMock: vi.fn(),
  updateItemMock: vi.fn(),
}));

vi.mock("@/server/db/items", () => ({
  getItemById: getItemByIdMock,
  getItemDetail: getItemDetailMock,
  replacePromptVariables: replacePromptVariablesMock,
  updateItem: updateItemMock,
}));

vi.mock("./deepseek", () => ({
  requestDeepSeekAnalysis: requestDeepSeekAnalysisMock,
}));

describe("analyzeStoredItem", () => {
  beforeEach(() => {
    getItemByIdMock.mockReset();
    getItemDetailMock.mockReset();
    replacePromptVariablesMock.mockReset();
    requestDeepSeekAnalysisMock.mockReset();
    updateItemMock.mockReset();
  });

  it("updates prompt metadata and replaces prompt variables without changing raw content", async () => {
    getItemByIdMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
      content: "请围绕 {{topic}} 输出文章",
    });
    requestDeepSeekAnalysisMock.mockResolvedValue({
      type: "prompt",
      title: "文章生成 Prompt",
      summary: "根据主题生成文章。",
      category: "Writing",
      tags: ["文章", "主题"],
      variables: [
        {
          name: "topic",
          description: "写作主题",
          defaultValue: "",
          required: true,
          sortOrder: 0,
        },
      ],
    });
    updateItemMock.mockResolvedValue({ id: "prompt-1" });
    replacePromptVariablesMock.mockResolvedValue([]);
    getItemDetailMock.mockResolvedValue({ id: "prompt-1", variables: [] });

    await expect(analyzeStoredItem("prompt-1")).resolves.toMatchObject({
      id: "prompt-1",
    });

    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith({
      content: "请围绕 {{topic}} 输出文章",
      type: "prompt",
    });
    expect(updateItemMock).toHaveBeenCalledWith("prompt-1", {
      title: "文章生成 Prompt",
      summary: "根据主题生成文章。",
      category: "Writing",
      tags: ["文章", "主题"],
      isAnalyzed: true,
    });
    expect(replacePromptVariablesMock).toHaveBeenCalledWith("prompt-1", [
      {
        name: "topic",
        description: "写作主题",
        defaultValue: "",
        required: true,
        sortOrder: 0,
      },
    ]);
  });

  it("does not write variables for skills even if the model returns them", async () => {
    getItemByIdMock.mockResolvedValue({
      id: "skill-1",
      type: "skill",
      content: "SKILL.md raw content",
    });
    requestDeepSeekAnalysisMock.mockResolvedValue({
      type: "skill",
      title: "调试 Skill",
      summary: "用于系统化调试。",
      category: "Agent",
      tags: ["调试"],
      variables: [{ name: "ignored", sortOrder: 0 }],
    });
    updateItemMock.mockResolvedValue({ id: "skill-1" });
    getItemDetailMock.mockResolvedValue({ id: "skill-1", variables: [] });

    await analyzeStoredItem("skill-1");

    expect(replacePromptVariablesMock).not.toHaveBeenCalled();
    expect(updateItemMock).toHaveBeenCalledWith("skill-1", {
      title: "调试 Skill",
      summary: "用于系统化调试。",
      category: "Agent",
      tags: ["调试"],
      isAnalyzed: true,
    });
  });

  it("leaves the stored item untouched when DeepSeek analysis fails", async () => {
    getItemByIdMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
      content: "raw prompt",
    });
    requestDeepSeekAnalysisMock.mockRejectedValue(
      new Error("DeepSeek did not return valid JSON."),
    );

    await expect(analyzeStoredItem("prompt-1")).rejects.toThrow(
      "DeepSeek did not return valid JSON.",
    );
    expect(updateItemMock).not.toHaveBeenCalled();
    expect(replacePromptVariablesMock).not.toHaveBeenCalled();
  });
});
