import { z } from "zod";

import {
  itemTypeSchema,
  promptVariableSchema,
  type ItemType,
  type PromptVariableInput,
} from "@/lib/schema/items";

export { buildFinalPrompt } from "@/features/items/final-prompt";

const rawVariableSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().optional().default(""),
  default_value: z.string().optional(),
  defaultValue: z.string().optional(),
  required: z.boolean().optional().default(false),
});

const analysisSchema = z.object({
  type: itemTypeSchema,
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(240),
  category: z.string().trim().min(1).max(32),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  variables: z.array(rawVariableSchema).default([]),
});

export type AnalysisResult = {
  type: ItemType;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  variables: PromptVariableInput[];
};

export function validateAnalysisCategory(
  category: string,
  allowedCategories: string[],
): string {
  if (allowedCategories.includes(category)) {
    return category;
  }

  return allowedCategories[0] ?? "Other";
}

function stripCodeFence(content: string) {
  const trimmed = content.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonCandidate(content: string) {
  const withoutFence = stripCodeFence(content);
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("DeepSeek did not return valid JSON.");
  }

  return withoutFence.slice(start, end + 1);
}

function repairJsonCandidate(candidate: string) {
  return candidate
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

export function parseAnalysisContent(content: string): AnalysisResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(repairJsonCandidate(extractJsonCandidate(content)));
  } catch {
    throw new Error("DeepSeek did not return valid JSON.");
  }

  const parsed = analysisSchema.parse(parsedJson);
  const seenTags = new Set<string>();

  return {
    type: parsed.type,
    title: parsed.title,
    summary: parsed.summary,
    category: parsed.category,
    tags: parsed.tags.filter((tag) => {
      if (seenTags.has(tag)) {
        return false;
      }

      seenTags.add(tag);
      return true;
    }),
    variables: parsed.variables.map((variable, index) =>
      promptVariableSchema.parse({
        name: variable.name,
        description: variable.description,
        defaultValue: variable.defaultValue ?? variable.default_value ?? "",
        required: variable.required,
        sortOrder: index,
      }),
    ),
  };
}
