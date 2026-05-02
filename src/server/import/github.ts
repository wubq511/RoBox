import type { StoredItem } from "@/server/db/types";
import { requestDeepSeekAnalysis } from "@/server/analyze/deepseek";
import { createItem, updateItem } from "@/server/db/items";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type GithubSkillTarget = {
  originalUrl: string;
  repositoryName: string;
  repositoryUrl: string;
  readmeCandidates: string[];
};

type GithubReadmeResult = {
  content: string;
  readmeUrl: string;
};

type CreateGithubSkillImportInput = {
  url: string;
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

function isImportableContentPath(path: string) {
  const fileName = path.split("/").at(-1) ?? "";

  return /^readme(\.[a-z0-9_-]+)?$/i.test(fileName) || /^skill\.md$/i.test(fileName);
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

  return {
    originalUrl: normalizeUrl(url),
    repositoryName,
    repositoryUrl: buildRepositoryUrl(repositoryName),
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
  const token = githubToken ?? process.env.GITHUB_TOKEN?.trim();
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

function buildAnalysisContent(target: GithubSkillTarget, readme: GithubReadmeResult) {
  const readmeContent =
    readme.content.length > maxReadmeAnalysisCharacters
      ? `${readme.content.slice(0, maxReadmeAnalysisCharacters)}\n\n[README truncated for analysis.]`
      : readme.content;

  return [
    `GitHub source: ${target.repositoryUrl}`,
    `Submitted URL: ${target.originalUrl}`,
    `Repository: ${target.repositoryName}`,
    `README URL: ${readme.readmeUrl}`,
    "",
    "README content:",
    readmeContent,
  ].join("\n");
}

export async function createGithubSkillImport(
  input: CreateGithubSkillImportInput,
  options: CreateGithubSkillImportOptions = {},
): Promise<GithubSkillImportResult> {
  const target = resolveGithubSkillUrl(input.url);
  const readme = await fetchGithubReadme(target, options);
  const createdItem = await createItem({
    type: "skill",
    title: target.repositoryName,
    summary: "",
    content: target.originalUrl,
    category: "Agent",
    tags: ["GitHub"],
    sourceUrl: target.repositoryUrl,
  });

  try {
    const analysis = await requestDeepSeekAnalysis({
      type: "skill",
      content: buildAnalysisContent(target, readme),
    });
    const updatedItem = await updateItem(createdItem.id, {
      title: analysis.title,
      summary: analysis.summary,
      category: analysis.category,
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
