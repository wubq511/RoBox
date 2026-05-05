import {
  getItemById,
  getItemDetail,
  replacePromptVariables,
  updateItem,
} from "@/server/db/items";
import { getUserCategoryNames, ensureDefaultCategories } from "@/server/db/categories";
import { validateAnalysisCategory } from "./parser";

import { requestDeepSeekAnalysis } from "./deepseek";

export class AnalyzeItemError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 422) {
    super(message);
    this.name = "AnalyzeItemError";
    this.statusCode = statusCode;
  }
}

export async function analyzeStoredItem(itemId: string) {
  const item = await getItemById(itemId);

  if (!item) {
    throw new AnalyzeItemError("Item not found.", 404);
  }

  await ensureDefaultCategories(item.userId);
  const categories = await getUserCategoryNames(item.userId, item.type);

  const analysis = await requestDeepSeekAnalysis({
    content: item.content,
    type: item.type,
    categories,
  });

  const validatedCategory = validateAnalysisCategory(
    analysis.category,
    categories,
  );

  const updatedItem = await updateItem(item.id, {
    title: analysis.title,
    summary: analysis.summary,
    category: validatedCategory,
    tags: analysis.tags,
    isAnalyzed: true,
  });

  if (!updatedItem) {
    throw new AnalyzeItemError("Item not found.", 404);
  }

  if (item.type === "prompt") {
    await replacePromptVariables(item.id, analysis.variables.slice(0, 20));
  }

  const detail = await getItemDetail(item.id);

  if (!detail) {
    throw new AnalyzeItemError("Item not found.", 404);
  }

  return detail;
}
