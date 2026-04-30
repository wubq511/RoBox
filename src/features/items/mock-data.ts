import type { LibraryItem, ItemType } from "@/features/items/types";

export const mockItems: LibraryItem[] = [
  {
    id: "prompt-paper-summary",
    type: "prompt",
    title: "论文结构化整理 Prompt",
    summary: "把论文 PDF 整理成中文结构化学习文档，保留结论、方法和可复用框架。",
    content:
      "请阅读 {{paper}}，输出中文学习文档，包含核心问题、方法、实验、结论和可迁移思路，最终格式为 {{output_format}}。",
    category: "Research",
    tags: ["论文", "PDF", "中文整理", "结构化", "学术"],
    sourceUrl: "",
    isFavorite: true,
    isAnalyzed: true,
    usageCount: 17,
    updatedAt: "2026-05-01 19:38",
    variables: [
      {
        name: "paper",
        description: "需要整理的论文 PDF 或原文",
        defaultValue: "",
        required: true,
      },
      {
        name: "output_format",
        description: "期望输出格式，例如 Markdown 或 PDF",
        defaultValue: "Markdown",
        required: false,
      },
    ],
  },
  {
    id: "skill-waza-design",
    type: "skill",
    title: "Waza / design",
    summary: "固定视觉方向后再写 UI，避免在实现阶段摇摆。",
    content:
      "https://github.com/tw93/Waza/tree/main/skills/design\n\nDesign: Build It With a Point of View. Lock the direction first, then write UI with a clear visual thesis.",
    category: "Design",
    tags: ["GitHub", "设计系统", "UI", "前端"],
    sourceUrl: "https://github.com/tw93/Waza/tree/main/skills/design",
    isFavorite: true,
    isAnalyzed: true,
    usageCount: 11,
    updatedAt: "2026-05-01 18:56",
    variables: [],
  },
  {
    id: "prompt-landing-page",
    type: "prompt",
    title: "Landing page teardown",
    summary: "从信息结构、视觉层级和 CTA 路径拆页面，不只看配色。",
    content:
      "拆解 {{url}} 的 landing page，从 hero、证据、行动路径、阻力点四段给出判断和修改建议。",
    category: "Design",
    tags: ["网页拆解", "转化", "文案", "CTA"],
    sourceUrl: "",
    isFavorite: false,
    isAnalyzed: true,
    usageCount: 8,
    updatedAt: "2026-04-30 23:12",
    variables: [
      {
        name: "url",
        description: "需要拆解的页面地址",
        defaultValue: "",
        required: true,
      },
    ],
  },
  {
    id: "skill-waza-think",
    type: "skill",
    title: "Waza / think",
    summary: "在编码前先定范围、约束和最短执行路径。",
    content:
      "https://github.com/tw93/Waza/tree/main/skills/think\n\nThink: Design and Validate Before You Build.",
    category: "Agent",
    tags: ["GitHub", "规划", "Agent", "架构"],
    sourceUrl: "https://github.com/tw93/Waza/tree/main/skills/think",
    isFavorite: false,
    isAnalyzed: true,
    usageCount: 6,
    updatedAt: "2026-04-29",
    variables: [],
  },
  {
    id: "prompt-agent-log",
    type: "prompt",
    title: "Agent 工作记录整理",
    summary: "尚未智能整理。点击智能整理后生成摘要、分类、标签和变量。",
    content:
      "把这段开发记录整理成日报，保留问题、决策、风险和下一步：{{log}}",
    category: "Agent",
    tags: ["未整理"],
    sourceUrl: "",
    isFavorite: true,
    isAnalyzed: false,
    usageCount: 3,
    updatedAt: "2026-04-28",
    variables: [],
  },
  {
    id: "skill-release-checklist",
    type: "skill",
    title: "Release checklist / Codex",
    summary: "尚未智能整理。点击智能整理后生成摘要、分类、标签和变量。",
    content:
      "发布前检查：验证、分支、提交、PR、部署说明、回滚路径。",
    category: "Coding",
    tags: ["未整理"],
    sourceUrl: "",
    isFavorite: false,
    isAnalyzed: false,
    usageCount: 2,
    updatedAt: "2026-04-27",
    variables: [],
  },
];

export function getItemsByType(type: ItemType) {
  return mockItems.filter((item) => item.type === type);
}

export function getFavoriteItems(limit: number) {
  return mockItems.filter((item) => item.isFavorite).slice(0, limit);
}

export function getPendingItems(limit?: number) {
  const items = mockItems.filter((item) => !item.isAnalyzed);
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export function getRecentItems(limit: number) {
  return [...mockItems]
    .sort((left, right) => right.usageCount - left.usageCount)
    .slice(0, limit);
}
