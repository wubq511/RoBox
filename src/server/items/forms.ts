import { itemEditorInputSchema, type ItemType } from "@/lib/schema/items";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function parseTagsInput(input: string) {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of input.split(",")) {
    const tag = rawTag.trim();

    if (!tag || seen.has(tag)) {
      continue;
    }

    seen.add(tag);
    tags.push(tag);
  }

  return tags;
}

export function parseVariablesInput(input: string) {
  if (!input.trim()) {
    return [];
  }

  const parsed = JSON.parse(input);

  if (!Array.isArray(parsed)) {
    throw new Error("Variables must be an array.");
  }

  return parsed.map((variable, index) => ({
    description: "",
    defaultValue: "",
    required: false,
    sortOrder: index,
    ...(typeof variable === "object" && variable !== null ? variable : {}),
  }));
}

export function parseItemFormData(formData: FormData, type: ItemType) {
  return itemEditorInputSchema.parse({
    type,
    title: getStringValue(formData, "title"),
    summary: getStringValue(formData, "summary"),
    content: getStringValue(formData, "content"),
    category: getStringValue(formData, "category") || undefined,
    tags: parseTagsInput(getStringValue(formData, "tags")),
    sourceUrl: getStringValue(formData, "sourceUrl"),
    variables: parseVariablesInput(getStringValue(formData, "variables")),
  });
}
