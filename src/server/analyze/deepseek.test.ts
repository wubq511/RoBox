import { describe, expect, it, vi } from "vitest";

import { requestDeepSeekAnalysis } from "./deepseek";

describe("requestDeepSeekAnalysis", () => {
  it("calls DeepSeek chat completions and parses the first message content", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: "prompt",
                  title: "文章 Prompt",
                  summary: "用于生成文章。",
                  category: "Writing",
                  tags: ["文章"],
                  variables: [],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      requestDeepSeekAnalysis(
        {
          type: "prompt",
          content: "请写一篇文章",
          categories: ["Writing", "Coding", "Other"],
        },
        {
          apiKey: "test-key",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-v4-flash",
          fetcher,
        },
      ),
    ).resolves.toMatchObject({
      title: "文章 Prompt",
      category: "Writing",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        },
      }),
    );
    const requestBody = JSON.parse(
      fetcher.mock.calls[0]?.[1]?.body as string,
    );
    expect(requestBody.response_format).toEqual({ type: "json_object" });
  });

  it("surfaces DeepSeek context length errors with a user-readable message", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message:
              "This model's maximum context length is 4096 tokens. Please reduce the length of the messages or completion.",
          },
        }),
        { status: 400 },
      ),
    );

    await expect(
      requestDeepSeekAnalysis(
        {
          type: "prompt",
          content: "很长的 Prompt",
          categories: ["Writing", "Other"],
        },
        {
          apiKey: "test-key",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-v4-flash",
          fetcher,
        },
      ),
    ).rejects.toMatchObject({
      code: "deepseek_context_length",
      statusCode: 400,
      message: "内容超过 DeepSeek 上下文限制，请缩短 Prompt 后重试。",
    });
  });

  it("surfaces truncated model output before JSON parsing", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "length",
              message: {
                content: "{\"type\":\"prompt\"",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      requestDeepSeekAnalysis(
        {
          type: "prompt",
          content: "请写一篇文章",
          categories: ["Writing", "Other"],
        },
        {
          apiKey: "test-key",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-v4-flash",
          fetcher,
        },
      ),
    ).rejects.toMatchObject({
      code: "deepseek_output_truncated",
      message: "DeepSeek 输出被截断，请重试或缩短原文。",
    });
  });

  it("surfaces schema validation failures separately from invalid JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: "prompt",
                  summary: "缺少 title 字段。",
                  category: "Writing",
                  tags: ["写作"],
                  variables: [],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      requestDeepSeekAnalysis(
        {
          type: "prompt",
          content: "请写一篇文章",
          categories: ["Writing", "Other"],
        },
        {
          apiKey: "test-key",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-v4-flash",
          fetcher,
        },
      ),
    ).rejects.toMatchObject({
      code: "deepseek_bad_response",
      message: "DeepSeek 返回字段不符合 RoBox 要求，请重试。",
    });
  });
});
