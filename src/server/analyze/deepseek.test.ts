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
  });
});
