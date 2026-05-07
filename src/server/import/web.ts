import type { StoredItem } from "@/server/db/types";
import { requestDeepSeekAnalysis } from "@/server/analyze/deepseek";
import { DEFAULT_CATEGORIES } from "@/lib/schema/items";
import { createItem, updateItem } from "@/server/db/items";
import { validateAnalysisCategory } from "@/server/analyze/parser";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type WebPageTextResult = {
  pageUrl: string;
  title: string;
  text: string;
};

type CreateWebToolImportInput = {
  url: string;
  categories?: string[];
};

type CreateWebToolImportOptions = {
  fetcher?: Fetcher;
  maxFetchCharacters?: number;
  maxRedirects?: number;
  timeoutMs?: number;
};

type WebToolImportResult = {
  item: StoredItem;
  pageUrl: string;
  warning?: string;
};

const maxWebFetchCharacters = 100_000;
const maxWebAnalysisCharacters = 24_000;

export class WebImportError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "WebImportError";
    this.statusCode = statusCode;
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error.";
}

function isIpv4Literal(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.startsWith("[") ||
    normalized.includes(":")
  ) {
    return true;
  }

  if (!isIpv4Literal(normalized)) {
    return false;
  }

  const parts = normalized.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  return true;
}

export function resolvePublicWebUrl(input: string) {
  const value = input.trim();

  if (!value) {
    throw new WebImportError("Web URL is required.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new WebImportError("Enter a valid web URL.");
  }

  if (url.protocol !== "https:") {
    throw new WebImportError("Web import requires an https URL.");
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  if (isBlockedHostname(url.hostname)) {
    throw new WebImportError("Only public HTTPS URLs can be imported.");
  }

  return url.toString();
}

function normalizeSubmittedUrl(input: string) {
  return resolvePublicWebUrl(input).replace(/\/$/, "");
}

function isSupportedContentType(contentType: string) {
  const normalized = contentType.toLowerCase();

  return (
    normalized.startsWith("text/html") ||
    normalized.startsWith("text/plain") ||
    normalized.startsWith("application/xhtml+xml")
  );
}

function decodeBasicEntities(input: string) {
  return input
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function extractTitle(html: string) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);

  return match ? collapseWhitespace(decodeBasicEntities(stripTags(match[1]))) : "";
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, " ");
}

function collapseWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function cleanPageText(content: string, contentType: string) {
  if (contentType.toLowerCase().startsWith("text/plain")) {
    return {
      title: "",
      text: collapseWhitespace(content),
    };
  }

  const title = extractTitle(content);
  const withoutNoise = content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  return {
    title,
    text: collapseWhitespace(decodeBasicEntities(stripTags(withoutNoise))),
  };
}

export async function fetchPublicWebPageText(
  inputUrl: string,
  options: CreateWebToolImportOptions = {},
): Promise<WebPageTextResult> {
  const fetcher = options.fetcher ?? fetch;
  const maxRedirects = options.maxRedirects ?? 3;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxFetchCharacters = options.maxFetchCharacters ?? maxWebFetchCharacters;
  let currentUrl = resolvePublicWebUrl(inputUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const response = await fetcher(currentUrl, {
      headers: {
        Accept: "text/html,text/plain",
        "User-Agent": "RoBox Web Import",
      },
      redirect: "manual",
      signal:
        typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
          ? AbortSignal.timeout(timeoutMs)
          : undefined,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        throw new WebImportError("Web page redirect is missing a location.", 502);
      }

      currentUrl = resolvePublicWebUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new WebImportError(
        `Web page request failed with status ${response.status}.`,
        502,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!isSupportedContentType(contentType)) {
      throw new WebImportError(
        "Web import only supports HTML or plain text pages.",
        415,
      );
    }

    const content = await response.text();

    if (content.length > maxFetchCharacters) {
      throw new WebImportError("Web page is too large to import.", 422);
    }

    const cleaned = cleanPageText(content, contentType);

    if (!cleaned.text) {
      throw new WebImportError("Web page did not contain readable text.", 422);
    }

    return {
      pageUrl: currentUrl,
      title: cleaned.title,
      text: cleaned.text,
    };
  }

  throw new WebImportError("Web page redirected too many times.", 508);
}

function buildAnalysisContent(pageUrl: string, page: WebPageTextResult) {
  const pageText =
    page.text.length > maxWebAnalysisCharacters
      ? `${page.text.slice(0, maxWebAnalysisCharacters)}\n\n[Web page text truncated for analysis.]`
      : page.text;

  return [
    `Web source: ${pageUrl}`,
    page.title ? `Page title: ${page.title}` : "",
    "",
    "Page content:",
    pageText,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function createWebToolImport(
  input: CreateWebToolImportInput,
  options: CreateWebToolImportOptions = {},
): Promise<WebToolImportResult> {
  const submittedUrl = normalizeSubmittedUrl(input.url);
  const page = await fetchPublicWebPageText(input.url, options);
  const userCategories = input.categories ?? [...DEFAULT_CATEGORIES];
  const defaultCategory = userCategories[0] ?? "Other";
  const pageHost = new URL(page.pageUrl).hostname;
  const createdItem = await createItem({
    type: "tool",
    title: pageHost,
    summary: "",
    content: submittedUrl,
    category: defaultCategory,
    tags: ["Website"],
    sourceUrl: page.pageUrl,
  });

  try {
    const analysis = await requestDeepSeekAnalysis({
      type: "tool",
      content: buildAnalysisContent(page.pageUrl, page),
      categories: userCategories,
    });
    const validatedCategory = validateAnalysisCategory(
      analysis.category,
      userCategories,
    );
    const updatedItem = await updateItem(createdItem.id, {
      title: analysis.title,
      summary: analysis.summary,
      category: validatedCategory,
      tags: analysis.tags,
      isAnalyzed: true,
    });

    return {
      item: updatedItem ?? createdItem,
      pageUrl: page.pageUrl,
    };
  } catch (error) {
    return {
      item: createdItem,
      pageUrl: page.pageUrl,
      warning: `Imported from website, but smart analyze failed: ${getErrorMessage(error)}`,
    };
  }
}
