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
  WebImportError,
  createWebToolImport,
  fetchPublicWebPageText,
  resolvePublicWebUrl,
} from "./web";

describe("web tool import helpers", () => {
  beforeEach(() => {
    createItemMock.mockReset();
    requestDeepSeekAnalysisMock.mockReset();
    updateItemMock.mockReset();
  });

  it("accepts public https URLs and rejects unsafe hosts", () => {
    expect(resolvePublicWebUrl(" https://example.com/tools?ref=robox#top ")).toBe(
      "https://example.com/tools?ref=robox",
    );

    expect(() => resolvePublicWebUrl("http://example.com")).toThrow(
      "Web import requires an https URL.",
    );
    expect(() => resolvePublicWebUrl("https://localhost:3000")).toThrow(
      "Only public HTTPS URLs can be imported.",
    );
    expect(() => resolvePublicWebUrl("https://127.0.0.1/docs")).toThrow(
      "Only public HTTPS URLs can be imported.",
    );
    expect(() => resolvePublicWebUrl("https://192.168.1.20/docs")).toThrow(
      "Only public HTTPS URLs can be imported.",
    );
  });

  it("fetches and cleans HTML page text", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        "<html><head><style>.x{}</style><script>bad()</script><title>Tool</title></head><body><h1>Raycast</h1><p>Fast launcher.</p></body></html>",
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      ),
    );

    await expect(
      fetchPublicWebPageText("https://raycast.com", { fetcher }),
    ).resolves.toEqual({
      pageUrl: "https://raycast.com/",
      title: "Tool",
      text: "Tool Raycast Fast launcher.",
    });
  });

  it("rejects unsupported content types and oversized pages", async () => {
    await expect(
      fetchPublicWebPageText("https://example.com/file.zip", {
        fetcher: vi.fn().mockResolvedValue(
          new Response("zip", {
            status: 200,
            headers: { "content-type": "application/zip" },
          }),
        ),
      }),
    ).rejects.toThrow("Web import only supports HTML or plain text pages.");

    await expect(
      fetchPublicWebPageText("https://example.com/large", {
        maxFetchCharacters: 5,
        fetcher: vi.fn().mockResolvedValue(
          new Response("too large", {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
        ),
      }),
    ).rejects.toThrow("Web page is too large to import.");
  });

  it("rejects redirects to unsafe locations", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://localhost/admin" },
      }),
    );

    await expect(
      fetchPublicWebPageText("https://example.com/redirect", { fetcher }),
    ).rejects.toThrow("Only public HTTPS URLs can be imported.");
  });

  it("imports a public web page as a tool and analyzes cleaned text", async () => {
    const createdItem = {
      id: "tool-1",
      type: "tool",
      title: "raycast.com",
      summary: "",
      content: "https://raycast.com",
      category: "Coding",
      tags: ["Website"],
      sourceUrl: "https://raycast.com/",
      isAnalyzed: false,
    };
    const analyzedItem = {
      ...createdItem,
      title: "Raycast",
      summary: "用于启动应用、搜索和自动化的效率工具。",
      tags: ["效率", "启动器"],
      isAnalyzed: true,
    };

    createItemMock.mockResolvedValue(createdItem);
    requestDeepSeekAnalysisMock.mockResolvedValue({
      title: "Raycast",
      summary: "用于启动应用、搜索和自动化的效率工具。",
      category: "Coding",
      tags: ["效率", "启动器"],
      variables: [],
    });
    updateItemMock.mockResolvedValue(analyzedItem);

    const fetcher = vi.fn().mockResolvedValue(
      new Response("<title>Raycast</title><main>Fast launcher.</main>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(
      createWebToolImport(
        { url: "https://raycast.com", categories: ["Coding", "Other"] },
        { fetcher },
      ),
    ).resolves.toMatchObject({
      item: analyzedItem,
      pageUrl: "https://raycast.com/",
    });

    expect(createItemMock).toHaveBeenCalledWith({
      type: "tool",
      title: "raycast.com",
      summary: "",
      content: "https://raycast.com",
      category: "Coding",
      tags: ["Website"],
      sourceUrl: "https://raycast.com/",
    });
    expect(requestDeepSeekAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "tool",
        categories: ["Coding", "Other"],
        content: expect.stringContaining("Page content:"),
      }),
    );
  });

  it("uses WebImportError status codes for recoverable import failures", () => {
    expect(new WebImportError("Nope", 422).statusCode).toBe(422);
  });
});
