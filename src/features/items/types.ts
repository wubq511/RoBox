import type { PromptVariableInput } from "@/lib/schema/items";

export type PromptVariable = Omit<PromptVariableInput, "sortOrder">;
