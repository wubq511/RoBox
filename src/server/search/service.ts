import {
  aiSearchRequestSchema,
  type AiSearchResponse,
  type AiSearchResultItem,
  type AiSearchSelectedType,
} from "@/lib/schema/ai-search";
import { itemTypes, type ItemType } from "@/lib/schema/items";
import { listAiSearchCandidates } from "@/server/db/items";
import type { StoredItem } from "@/server/db/types";

import {
  requestAiSearchRanking,
  type RawAiSearchRanking,
} from "./deepseek";

type NormalizeAiSearchRankingInput = {
  query: string;
  selectedType: AiSearchSelectedType;
  targetTypes: ItemType[];
  scannedCount: number;
  candidateLimitReached: boolean;
  candidates: AiSearchResultItem[];
  ranking: RawAiSearchRanking;
};

type RunAiSearchOptions = {
  userId?: string;
  requestRanking?: typeof requestAiSearchRanking;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 100);
}

function getTargetTypes(selectedType: AiSearchSelectedType): ItemType[] {
  return selectedType === "auto" ? [...itemTypes] : [selectedType];
}

function fallbackText(value: string, fallback: string) {
  const normalized = normalizeWhitespace(value);
  return normalized || fallback;
}

function uniqueItemTypes(types: ItemType[]) {
  const seen = new Set<ItemType>();
  return types.filter((type) => {
    if (seen.has(type)) {
      return false;
    }

    seen.add(type);
    return true;
  });
}

export function buildAiSearchCandidates(items: StoredItem[]): AiSearchResultItem[] {
  return items.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    summary: item.summary,
    category: item.category,
    tags: item.tags,
    sourceUrl: item.sourceUrl,
    isFavorite: item.isFavorite,
    isAnalyzed: item.isAnalyzed,
    usageCount: item.usageCount,
    updatedAt: item.updatedAt,
    contentPreview: normalizeWhitespace(item.content).slice(0, 360),
  }));
}

export function normalizeAiSearchRanking({
  query,
  selectedType,
  targetTypes,
  scannedCount,
  candidateLimitReached,
  candidates,
  ranking,
}: NormalizeAiSearchRankingInput): AiSearchResponse {
  const candidatesByKey = new Map(
    candidates.map((candidate) => [`${candidate.type}:${candidate.id}`, candidate]),
  );
  const seen = new Set<string>();
  const resultsByType = new Map<ItemType, AiSearchResponse["groups"][number]["results"]>(
    targetTypes.map((type) => [type, []]),
  );

  for (const result of ranking.results) {
    const key = `${result.type}:${result.id}`;
    const candidate = candidatesByKey.get(key);

    if (!candidate || seen.has(key) || !resultsByType.has(result.type)) {
      continue;
    }

    seen.add(key);
    resultsByType.get(result.type)?.push({
      item: candidate,
      score: clampScore(result.score),
      reason: fallbackText(result.reason, "与当前需求相关。"),
      useCase: fallbackText(result.use_case, "适合当前检索场景。"),
    });
  }

  const groups = targetTypes.map((type) => ({
    type,
    results: [...(resultsByType.get(type) ?? [])]
      .sort((left, right) => right.score - left.score)
      .slice(0, 6),
  }));
  const inferredTypes =
    selectedType === "auto"
      ? uniqueItemTypes(
          ranking.inferred_types.filter((type) => targetTypes.includes(type)),
        )
      : [selectedType];

  return {
    query,
    selectedType,
    inferredTypes: inferredTypes.length > 0 ? inferredTypes : targetTypes,
    scannedCount,
    candidateLimitReached,
    groups,
  };
}

export async function runAiSearch(
  input: unknown,
  options: RunAiSearchOptions = {},
) {
  const request = aiSearchRequestSchema.parse(input);
  const targetTypes = getTargetTypes(request.type);
  const candidateResult = await listAiSearchCandidates(
    { selectedType: request.type },
    { userId: options.userId, nextPath: "/ai-search" },
  );
  const candidates = buildAiSearchCandidates(candidateResult.items);

  if (candidates.length === 0) {
    return normalizeAiSearchRanking({
      query: request.query,
      selectedType: request.type,
      targetTypes,
      scannedCount: 0,
      candidateLimitReached: candidateResult.candidateLimitReached,
      candidates,
      ranking: {
        inferred_types: request.type === "auto" ? targetTypes : [request.type],
        results: [],
      },
    });
  }

  const requestRanking = options.requestRanking ?? requestAiSearchRanking;
  const ranking = await requestRanking({
    query: request.query,
    selectedType: request.type,
    candidates,
  });

  return normalizeAiSearchRanking({
    query: request.query,
    selectedType: request.type,
    targetTypes,
    scannedCount: candidateResult.scannedCount,
    candidateLimitReached: candidateResult.candidateLimitReached,
    candidates,
    ranking,
  });
}
