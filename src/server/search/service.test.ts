import { describe, expect, it } from "vitest";

import type { StoredItem } from "@/server/db/types";

import {
  buildAiSearchCandidates,
  normalizeAiSearchRanking,
} from "./service";

function createStoredItem(overrides: Partial<StoredItem> & Pick<StoredItem, "id">): StoredItem {
  const { id, ...rest } = overrides;

  return {
    id,
    userId: "user-1",
    type: "prompt",
    title: "Prompt title",
    summary: "Prompt summary",
    content: "x".repeat(500),
    category: "Research",
    tags: ["paper", "study"],
    sourceUrl: "",
    isFavorite: false,
    isAnalyzed: true,
    usageCount: 3,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
    ...rest,
  };
}

describe("AI search service helpers", () => {
  it("builds candidates with a 360 character content preview", () => {
    const [candidate] = buildAiSearchCandidates([
      createStoredItem({
        id: "prompt-1",
        content: `  ${"a".repeat(420)}  `,
      }),
    ]);

    expect(candidate).toMatchObject({
      id: "prompt-1",
      type: "prompt",
      title: "Prompt title",
      contentPreview: "a".repeat(360),
    });
  });

  it("drops unknown and duplicate ranking ids, clamps scores, and limits each group to six results", () => {
    const items = [
      createStoredItem({ id: "prompt-1", type: "prompt", title: "Prompt 1" }),
      createStoredItem({ id: "prompt-2", type: "prompt", title: "Prompt 2" }),
      createStoredItem({ id: "prompt-3", type: "prompt", title: "Prompt 3" }),
      createStoredItem({ id: "prompt-4", type: "prompt", title: "Prompt 4" }),
      createStoredItem({ id: "prompt-5", type: "prompt", title: "Prompt 5" }),
      createStoredItem({ id: "prompt-6", type: "prompt", title: "Prompt 6" }),
      createStoredItem({ id: "prompt-7", type: "prompt", title: "Prompt 7" }),
      createStoredItem({ id: "skill-1", type: "skill", title: "Skill 1" }),
    ];
    const candidates = buildAiSearchCandidates(items);
    const response = normalizeAiSearchRanking({
      query: "paper workflow",
      selectedType: "auto",
      targetTypes: ["prompt", "skill", "tool"],
      scannedCount: candidates.length,
      candidateLimitReached: false,
      candidates,
      ranking: {
        inferred_types: ["prompt", "skill", "tool"],
        results: [
          { id: "missing", type: "prompt", score: 100, reason: "unknown", use_case: "unknown" },
          { id: "prompt-1", type: "prompt", score: 120, reason: "best", use_case: "paper" },
          { id: "prompt-1", type: "prompt", score: 80, reason: "duplicate", use_case: "paper" },
          { id: "prompt-2", type: "prompt", score: 90, reason: "match", use_case: "paper" },
          { id: "prompt-3", type: "prompt", score: 70, reason: "match", use_case: "paper" },
          { id: "prompt-4", type: "prompt", score: 60, reason: "match", use_case: "paper" },
          { id: "prompt-5", type: "prompt", score: 50, reason: "match", use_case: "paper" },
          { id: "prompt-6", type: "prompt", score: 40, reason: "match", use_case: "paper" },
          { id: "prompt-7", type: "prompt", score: 30, reason: "too many", use_case: "paper" },
          { id: "skill-1", type: "skill", score: -10, reason: "skill match", use_case: "agent" },
        ],
      },
    });

    const promptGroup = response.groups.find((group) => group.type === "prompt");
    const skillGroup = response.groups.find((group) => group.type === "skill");

    expect(response.inferredTypes).toEqual(["prompt", "skill", "tool"]);
    expect(promptGroup?.results.map((result) => result.item.id)).toEqual([
      "prompt-1",
      "prompt-2",
      "prompt-3",
      "prompt-4",
      "prompt-5",
      "prompt-6",
    ]);
    expect(promptGroup?.results[0].score).toBe(100);
    expect(skillGroup?.results[0].score).toBe(0);
  });
});
