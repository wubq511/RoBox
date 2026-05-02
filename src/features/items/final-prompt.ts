import type { PromptVariableInput } from "@/lib/schema/items";

export function buildFinalPrompt(
  content: string,
  values: Record<string, string | undefined>,
  variables: PromptVariableInput[],
) {
  const variablesByName = new Map(
    variables.map((variable) => [variable.name, variable]),
  );

  return content.replace(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g, (match, key: string) => {
    const value = values[key]?.trim();

    if (value) {
      return value;
    }

    const defaultValue = variablesByName.get(key)?.defaultValue?.trim();

    return defaultValue || match;
  });
}
