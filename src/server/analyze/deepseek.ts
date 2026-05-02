import { z } from "zod";

import type { ItemType } from "@/lib/schema/items";

import { parseAnalysisContent } from "./parser";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type RequestDeepSeekAnalysisInput = {
  type: ItemType;
  content: string;
};

type RequestDeepSeekAnalysisOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetcher?: Fetcher;
  model?: string;
  timeoutMs?: number;
};

const chatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable(),
        }),
      }),
    )
    .min(1),
});

function readDeepSeekApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing required environment variable: DEEPSEEK_API_KEY");
  }

  return apiKey;
}

function getDeepSeekBaseUrl(baseUrl?: string) {
  return (baseUrl ?? process.env.DEEPSEEK_API_BASE_URL ?? "https://api.deepseek.com")
    .trim()
    .replace(/\/+$/, "");
}

function buildAnalyzePrompt({ type, content }: RequestDeepSeekAnalysisInput) {
  return `你是一个严谨的信息整理助手。请根据用户提供的 ${type} 原文输出结构化 JSON。

要求：
1. 只能输出 JSON，不要输出 Markdown。
2. type 必须是 "${type}"。
3. category 必须从以下分类中选择：Writing, Coding, Research, Design, Study, Agent, Content, Other。
4. tags 输出 3-8 个中文标签；如果内容很短，至少输出 1 个标签。
5. 如果 type 是 "prompt"，请识别需要用户填写的变量，变量名优先匹配 {{variable}} 占位符。
6. 如果 type 是 "skill"，variables 必须输出空数组。
7. summary 用中文，控制在 80 字以内。
8. title 简短清晰，不超过 30 字。

输出格式：
{
  "type": "${type}",
  "title": "",
  "summary": "",
  "category": "Other",
  "tags": [],
  "variables": [
    {
      "name": "",
      "description": "",
      "default_value": "",
      "required": true
    }
  ]
}

用户内容：
${content}`;
}

export async function requestDeepSeekAnalysis(
  input: RequestDeepSeekAnalysisInput,
  options: RequestDeepSeekAnalysisOptions = {},
) {
  const apiKey = options.apiKey ?? readDeepSeekApiKey();
  const baseUrl = getDeepSeekBaseUrl(options.baseUrl);
  const fetcher = options.fetcher ?? fetch;
  const model =
    options.model ?? process.env.DEEPSEEK_MODEL?.trim() ?? "deepseek-v4-flash";
  const timeoutMs = options.timeoutMs ?? 30_000;

  const response = await fetcher(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "你只输出可解析 JSON，不输出解释、Markdown 或代码块。",
        },
        {
          role: "user",
          content: buildAnalyzePrompt(input),
        },
      ],
      stream: false,
      temperature: 0.2,
      max_tokens: 1200,
    }),
    signal:
      typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? AbortSignal.timeout(timeoutMs)
        : undefined,
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with status ${response.status}.`);
  }

  const payload = chatCompletionSchema.parse(await response.json());
  const content = payload.choices[0]?.message.content;

  if (!content) {
    throw new Error("DeepSeek returned an empty analysis.");
  }

  return parseAnalysisContent(content);
}
