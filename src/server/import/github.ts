import type { StoredItem } from "@/server/db/types";
import { getServerEnv } from "@/lib/env";
import { requestDeepSeekAnalysis } from "@/server/analyze/deepseek";
import { DEFAULT_CATEGORIES, type ItemType } from "@/lib/schema/items";
import { createItem, updateItem } from "@/server/db/items";
import { validateAnalysisCategory } from "@/server/analyze/parser";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type GithubSourceKind = "repository-readme" | "readme-file" | "skill-file";

export type GithubSkillTarget = {
  originalUrl: string;
  repositoryName: string;
  repositoryUrl: string;
  displaySourceUrl: string;
  sourceKind: GithubSourceKind;
  readmeCandidates: string[];
};

type GithubReadmeResult = {
  content: string;
  readmeUrl: string;
};

type CreateGithubSkillImportInput = {
  url: string;
  type?: Extract<ItemType, "skill" | "tool">;
  categories?: string[];
};

type CreateGithubSkillImportOptions = {
  fetcher?: Fetcher;
  githubToken?: string;
};

type GithubSkillImportResult = {
  item: StoredItem;
  readmeUrl: string;
  warning?: string;
};

const allowedHosts = new Set(["github.com", "raw.githubusercontent.com"]);
const defaultReadmeCandidates = ["README.md", "README.mdx", "README.txt", "README"];
const maxReadmeAnalysisCharacters = 24_000;
const maxReadmeFetchCharacters = 100_000;
const maxSkillExcerptFetchCharacters = 32_000;
const maxSkillIntroCharacters = 12_000;

export class GithubImportError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "GithubImportError";
    this.statusCode = statusCode;
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error.";
}

function parseHttpsUrl(input: string) {
  const value = input.trim();

  if (!value) {
    throw new GithubImportError("GitHub URL is required.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new GithubImportError("Enter a valid GitHub URL.");
  }

  if (url.protocol !== "https:") {
    throw new GithubImportError("GitHub import requires an https URL.");
  }

  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.toLowerCase();

  if (!allowedHosts.has(url.hostname)) {
    throw new GithubImportError(
      "Only github.com and raw.githubusercontent.com URLs are allowed.",
    );
  }

  return url;
}

function normalizeUrl(url: URL) {
  return url.toString().replace(/\/$/, "");
}

function getPathSegments(url: URL) {
  return url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}

function normalizeRepoName(owner: string, repo: string) {
  return `${owner}/${repo.replace(/\.git$/i, "")}`;
}

function buildRepositoryUrl(repositoryName: string) {
  return `https://github.com/${repositoryName}`;
}

function buildRawUrl(repositoryName: string, ref: string, path: string) {
  return `https://raw.githubusercontent.com/${repositoryName}/${ref}/${path}`;
}

function buildGithubBlobUrl(repositoryName: string, ref: string, path = "") {
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  const suffix = normalizedPath ? `/${normalizedPath}` : "";

  return `https://github.com/${repositoryName}/blob/${ref}${suffix}`;
}

function isReadmeContentPath(path: string) {
  const fileName = path.split("/").at(-1) ?? "";

  return /^readme(\.[a-z0-9_-]+)?$/i.test(fileName);
}

function isSkillContentPath(path: string) {
  const fileName = path.split("/").at(-1) ?? "";

  return /^skill\.md$/i.test(fileName);
}

function isImportableContentPath(path: string) {
  return isReadmeContentPath(path) || isSkillContentPath(path);
}

function buildSkillDisplaySourceUrl(
  repositoryName: string,
  ref: string,
  contentPath: string,
) {
  const directoryPath = contentPath.split("/").slice(0, -1).join("/");

  return buildGithubBlobUrl(repositoryName, ref, directoryPath);
}

function buildRepositoryReadmeCandidates(repositoryName: string) {
  return [
    ...defaultReadmeCandidates.map((path) =>
      buildRawUrl(repositoryName, "HEAD", path),
    ),
    buildRawUrl(repositoryName, "main", "README.md"),
    buildRawUrl(repositoryName, "master", "README.md"),
  ];
}

function resolveGithubUrl(url: URL): GithubSkillTarget {
  const segments = getPathSegments(url);
  const [owner, rawRepo, marker, ref, ...contentSegments] = segments;

  if (!owner || !rawRepo) {
    throw new GithubImportError(
      "GitHub import needs a repository URL, README link, or SKILL.md link.",
    );
  }

  const repositoryName = normalizeRepoName(owner, rawRepo);
  const repositoryUrl = buildRepositoryUrl(repositoryName);

  if (!marker) {
    return {
      originalUrl: normalizeUrl(url),
      repositoryName,
      repositoryUrl,
      displaySourceUrl: repositoryUrl,
      sourceKind: "repository-readme",
      readmeCandidates: buildRepositoryReadmeCandidates(repositoryName),
    };
  }

  if (marker === "blob" && ref && contentSegments.length > 0) {
    const contentPath = contentSegments.join("/");

    if (!isImportableContentPath(contentPath)) {
      throw new GithubImportError(
        "GitHub import needs a repository URL, README link, or SKILL.md link.",
      );
    }

    return {
      originalUrl: normalizeUrl(url),
      repositoryName,
      repositoryUrl,
      displaySourceUrl: isSkillContentPath(contentPath)
        ? buildSkillDisplaySourceUrl(repositoryName, ref, contentPath)
        : repositoryUrl,
      sourceKind: isSkillContentPath(contentPath) ? "skill-file" : "readme-file",
      readmeCandidates: [buildRawUrl(repositoryName, ref, contentPath)],
    };
  }

  throw new GithubImportError(
    "GitHub import needs a repository URL, README link, or SKILL.md link.",
  );
}

function resolveRawGithubUrl(url: URL): GithubSkillTarget {
  const segments = getPathSegments(url);
  const [owner, rawRepo, ref, ...contentSegments] = segments;

  if (!owner || !rawRepo || !ref || contentSegments.length === 0) {
    throw new GithubImportError(
      "Raw GitHub import needs an owner, repository, branch, and file path.",
    );
  }

  const contentPath = contentSegments.join("/");

  if (!isImportableContentPath(contentPath)) {
    throw new GithubImportError(
      "GitHub import needs a repository URL, README link, or SKILL.md link.",
    );
  }

  const repositoryName = normalizeRepoName(owner, rawRepo);
  const repositoryUrl = buildRepositoryUrl(repositoryName);

  return {
    originalUrl: normalizeUrl(url),
    repositoryName,
    repositoryUrl,
    displaySourceUrl: isSkillContentPath(contentPath)
      ? buildSkillDisplaySourceUrl(repositoryName, ref, contentPath)
      : repositoryUrl,
    sourceKind: isSkillContentPath(contentPath) ? "skill-file" : "readme-file",
    readmeCandidates: [normalizeUrl(url)],
  };
}

export function resolveGithubSkillUrl(input: string): GithubSkillTarget {
  const url = parseHttpsUrl(input);

  return url.hostname === "raw.githubusercontent.com"
    ? resolveRawGithubUrl(url)
    : resolveGithubUrl(url);
}

function buildFetchHeaders(githubToken?: string) {
  const token = githubToken ?? getServerEnv("GITHUB_TOKEN");
  const headers: Record<string, string> = {
    Accept: "text/plain",
    "User-Agent": "RoBox GitHub Import",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchGithubReadme(
  target: GithubSkillTarget,
  options: CreateGithubSkillImportOptions = {},
): Promise<GithubReadmeResult> {
  const fetcher = options.fetcher ?? fetch;
  const headers = buildFetchHeaders(options.githubToken);

  for (const candidate of target.readmeCandidates) {
    const response = await fetcher(candidate, {
      headers,
      redirect: "follow",
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok) {
      throw new GithubImportError(
        `GitHub README request failed with status ${response.status}.`,
        502,
      );
    }

    const content = await response.text();

    if (content.length > maxReadmeFetchCharacters) {
      throw new GithubImportError(
        "README file is too large to import.",
        422,
      );
    }

    if (content.trim()) {
      return {
        content,
        readmeUrl: candidate,
      };
    }
  }

  throw new GithubImportError(
    "Could not find a readable README or SKILL.md file for this GitHub link.",
    404,
  );
}

async function readResponseTextUpTo(response: Response, maxCharacters: number) {
  const reader = response.body?.getReader();

  if (!reader) {
    const content = await response.text();

    return content.slice(0, maxCharacters);
  }

  const decoder = new TextDecoder();
  let content = "";
  let reachedLimit = false;

  while (content.length < maxCharacters) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    content += decoder.decode(value, { stream: true });

    if (content.length >= maxCharacters) {
      reachedLimit = true;
      break;
    }
  }

  content += decoder.decode();

  if (reachedLimit) {
    await reader.cancel().catch(() => undefined);
  }

  return content.slice(0, maxCharacters);
}

function trimAtParagraphBoundary(content: string, maxCharacters: number) {
  if (content.length <= maxCharacters) {
    return content.trim();
  }

  const clipped = content.slice(0, maxCharacters);
  const paragraphBreak = clipped.lastIndexOf("\n\n");

  if (paragraphBreak > maxCharacters / 2) {
    return clipped.slice(0, paragraphBreak).trim();
  }

  const lineBreak = clipped.lastIndexOf("\n");

  if (lineBreak > maxCharacters / 2) {
    return clipped.slice(0, lineBreak).trim();
  }

  return clipped.trim();
}

function extractSkillIntro(content: string) {
  const normalizedContent = content.replace(/\r\n?/g, "\n");
  const firstH2Match = /^##\s+/m.exec(normalizedContent);
  const intro = firstH2Match
    ? normalizedContent.slice(0, firstH2Match.index)
    : normalizedContent;

  return trimAtParagraphBoundary(intro, maxSkillIntroCharacters);
}

export async function fetchGithubSkillExcerpt(
  target: GithubSkillTarget,
  options: CreateGithubSkillImportOptions = {},
): Promise<GithubReadmeResult> {
  const fetcher = options.fetcher ?? fetch;
  const headers = {
    ...buildFetchHeaders(options.githubToken),
    Range: `bytes=0-${maxSkillExcerptFetchCharacters - 1}`,
  };

  for (const candidate of target.readmeCandidates) {
    const response = await fetcher(candidate, {
      headers,
      redirect: "follow",
    });

    if (response.status === 404) {
      continue;
    }

    if (!response.ok && response.status !== 206) {
      throw new GithubImportError(
        `GitHub SKILL.md request failed with status ${response.status}.`,
        502,
      );
    }

    const content = extractSkillIntro(
      await readResponseTextUpTo(response, maxSkillExcerptFetchCharacters),
    );

    if (content.trim()) {
      return {
        content,
        readmeUrl: candidate,
      };
    }
  }

  throw new GithubImportError(
    "Could not find a readable SKILL.md file for this GitHub link.",
    404,
  );
}

function buildAnalysisContent(target: GithubSkillTarget, readme: GithubReadmeResult) {
  const readmeContent =
    readme.content.length > maxReadmeAnalysisCharacters
      ? `${readme.content.slice(0, maxReadmeAnalysisCharacters)}\n\n[README truncated for analysis.]`
      : readme.content;
  const sourceLabel =
    target.sourceKind === "skill-file" ? "SKILL.md URL" : "README URL";
  const contentLabel =
    target.sourceKind === "skill-file"
      ? "SKILL.md intro content:"
      : "README content:";

  return [
    `GitHub source: ${target.displaySourceUrl}`,
    `Submitted URL: ${target.originalUrl}`,
    `Repository: ${target.repositoryName}`,
    `${sourceLabel}: ${readme.readmeUrl}`,
    "",
    contentLabel,
    readmeContent,
  ].join("\n");
}

export async function createGithubSkillImport(
  input: CreateGithubSkillImportInput,
  options: CreateGithubSkillImportOptions = {},
): Promise<GithubSkillImportResult> {
  const target = resolveGithubSkillUrl(input.url);
  const userCategories = input.categories ?? [...DEFAULT_CATEGORIES];
  const defaultCategory = userCategories[0] ?? "Other";
  const itemType = input.type ?? "skill";

  if (itemType === "tool" && target.sourceKind === "skill-file") {
    throw new GithubImportError(
      "Tool GitHub import requires a repository or README link.",
      400,
    );
  }

  const readme =
    itemType === "skill" && target.sourceKind === "skill-file"
      ? await fetchGithubSkillExcerpt(target, options)
      : await fetchGithubReadme(target, options);
  const createdItem = await createItem({
    type: itemType,
    title: target.repositoryName,
    summary: "",
    content: target.originalUrl,
    category: defaultCategory,
    tags: ["GitHub"],
    sourceUrl: target.displaySourceUrl,
  });

  try {
    const analysis = await requestDeepSeekAnalysis({
      type: itemType,
      content: buildAnalysisContent(target, readme),
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
      readmeUrl: readme.readmeUrl,
    };
  } catch (error) {
    return {
      item: createdItem,
      readmeUrl: readme.readmeUrl,
      warning: `Imported from GitHub, but smart analyze failed: ${getErrorMessage(error)}`,
    };
  }
}
