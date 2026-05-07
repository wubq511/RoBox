import { describe, expect, it } from "vitest";

import { buildFinalPrompt, parseAnalysisContent } from "./parser";

describe("analysis parser", () => {
  it("parses fenced DeepSeek JSON and normalizes prompt variables", () => {
    const result = parseAnalysisContent(`
\`\`\`json
{
  "type": "prompt",
  "title": "论文整理 Prompt",
  "summary": "用于把论文内容整理成中文学习笔记。",
  "category": "Research",
  "tags": ["论文", "学习", "中文"],
  "variables": [
    {
      "name": "paper",
      "description": "论文内容",
      "required": true,
      "default_value": ""
    }
  ]
}
\`\`\`
`);

    expect(result).toEqual({
      type: "prompt",
      title: "论文整理 Prompt",
      summary: "用于把论文内容整理成中文学习笔记。",
      category: "Research",
      tags: ["论文", "学习", "中文"],
      variables: [
        {
          name: "paper",
          description: "论文内容",
          defaultValue: "",
          required: true,
          sortOrder: 0,
        },
      ],
    });
  });

  it("repairs common trailing commas before validation", () => {
    expect(
      parseAnalysisContent(`{
        "type": "skill",
        "title": "Codex 方案 Skill",
        "summary": "用于开发前验证方案风险。",
        "category": "Agent",
        "tags": ["Codex", "方案"],
        "variables": [],
      }`),
    ).toMatchObject({
      type: "skill",
      title: "Codex 方案 Skill",
      variables: [],
    });
  });

  it("parses tool analysis and discards model-provided variables", () => {
    expect(
      parseAnalysisContent(`{
        "type": "tool",
        "title": "Raycast",
        "summary": "用于快速启动应用和执行自动化的效率工具。",
        "category": "Coding",
        "tags": ["效率", "启动器"],
        "variables": [
          {
            "name": "ignored",
            "description": "Tools 不应保留变量",
            "required": true,
            "default_value": ""
          }
        ]
      }`),
    ).toEqual({
      type: "tool",
      title: "Raycast",
      summary: "用于快速启动应用和执行自动化的效率工具。",
      category: "Coding",
      tags: ["效率", "启动器"],
      variables: [],
    });
  });

  it("fails with a recoverable message when content is not valid JSON", () => {
    expect(() => parseAnalysisContent("模型输出了一段解释文字")).toThrow(
      "DeepSeek did not return valid JSON.",
    );
  });
});

describe("final prompt builder", () => {
  it("fills known double-brace variables and preserves missing required values", () => {
    expect(
      buildFinalPrompt("请围绕 {{ topic }} 输出 {{format}}。", {
        topic: "RoBox",
        format: "",
      }, [
        {
          name: "format",
          description: "",
          defaultValue: "Markdown",
          required: false,
          sortOrder: 0,
        },
      ]),
    ).toBe("请围绕 RoBox 输出 Markdown。");
  });
});
