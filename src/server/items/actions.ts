"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type CopyAction, type ItemType } from "@/lib/schema/items";
import {
  createItem,
  deleteItem,
  recordCopyAction,
  replacePromptVariables,
  toggleFavorite,
  updateItem,
} from "@/server/db/items";

import type { ItemFormState } from "./form-state";
import { parseItemFormData } from "./forms";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getItemId(formData: FormData) {
  const itemId = getStringValue(formData, "itemId").trim();

  if (!itemId) {
    throw new Error("Item id is required.");
  }

  return itemId;
}

function getItemType(formData: FormData): ItemType {
  const type = getStringValue(formData, "type");

  if (type === "skill" || type === "tool") {
    return type;
  }

  return "prompt";
}

function toMutationInput(formData: FormData, type: ItemType) {
  const parsed = parseItemFormData(formData, type);

  return {
    baseInput: {
      type: parsed.type,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      category: parsed.category,
      tags: parsed.tags,
      sourceUrl: parsed.sourceUrl,
    },
    variables: parsed.variables,
  };
}

function getPathsForType(type: ItemType, itemId: string) {
  const collectionPath =
    type === "prompt" ? "/prompts" : type === "skill" ? "/skills" : "/tools";

  return {
    collectionPath,
    detailPath: `${collectionPath}/${itemId}`,
  };
}

function revalidateItemPaths(type: ItemType, itemId: string) {
  const { collectionPath, detailPath } = getPathsForType(type, itemId);

  revalidatePath("/dashboard");
  revalidatePath("/favorites");
  revalidatePath(collectionPath);
  revalidatePath(detailPath);
}

function toErrorState(error: unknown): ItemFormState {
  if (error instanceof Error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "error",
    message: "Unknown error.",
  };
}

export async function createPromptAction(
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  let createdItem;

  try {
    const { baseInput, variables } = toMutationInput(formData, "prompt");

    createdItem = await createItem(baseInput);
    await replacePromptVariables(createdItem.id, variables);
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths("prompt", createdItem.id);
  redirect(`/prompts/${createdItem.id}`);
}

export async function createSkillAction(
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  let createdItem;

  try {
    const { baseInput } = toMutationInput(formData, "skill");

    createdItem = await createItem(baseInput);
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths("skill", createdItem.id);
  redirect(`/skills/${createdItem.id}`);
}

export async function createToolAction(
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  let createdItem;

  try {
    const { baseInput } = toMutationInput(formData, "tool");

    createdItem = await createItem(baseInput);
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths("tool", createdItem.id);
  redirect(`/tools/${createdItem.id}`);
}

export async function updatePromptAction(
  itemId: string,
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  try {
    const { baseInput, variables } = toMutationInput(formData, "prompt");
    const updatedItem = await updateItem(itemId, {
      title: baseInput.title,
      summary: baseInput.summary,
      content: baseInput.content,
      category: baseInput.category,
      tags: baseInput.tags,
      sourceUrl: baseInput.sourceUrl,
    });

    if (!updatedItem) {
      throw new Error("Item not found.");
    }

    await replacePromptVariables(itemId, variables);
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths("prompt", itemId);
  redirect(`/prompts/${itemId}`);
}

export async function updateSkillAction(
  itemId: string,
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  try {
    const { baseInput } = toMutationInput(formData, "skill");
    const updatedItem = await updateItem(itemId, {
      title: baseInput.title,
      summary: baseInput.summary,
      content: baseInput.content,
      category: baseInput.category,
      tags: baseInput.tags,
      sourceUrl: baseInput.sourceUrl,
    });

    if (!updatedItem) {
      throw new Error("Item not found.");
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths("skill", itemId);
  redirect(`/skills/${itemId}`);
}

export async function updateToolAction(
  itemId: string,
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  try {
    const { baseInput } = toMutationInput(formData, "tool");
    const updatedItem = await updateItem(itemId, {
      title: baseInput.title,
      summary: baseInput.summary,
      content: baseInput.content,
      category: baseInput.category,
      tags: baseInput.tags,
      sourceUrl: baseInput.sourceUrl,
    });

    if (!updatedItem) {
      throw new Error("Item not found.");
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths("tool", itemId);
  redirect(`/tools/${itemId}`);
}

export async function toggleFavoriteAction(formData: FormData) {
  let itemId: string = "";
  let type: ItemType = "prompt";

  try {
    itemId = getItemId(formData);
    type = getItemType(formData);
    const item = await toggleFavorite(itemId);

    if (!item) {
      throw new Error("Item not found.");
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidateItemPaths(type, itemId);
}

export async function deleteItemAction(
  _previousState: ItemFormState | void,
  formData: FormData,
) {
  let itemId: string = "";
  let type: ItemType = "prompt";

  try {
    itemId = getItemId(formData);
    type = getItemType(formData);
    const item = await deleteItem(itemId);

    if (!item) {
      throw new Error("Item not found.");
    }
  } catch (error) {
    return toErrorState(error);
  }

  const { collectionPath } = getPathsForType(type, itemId);
  revalidateItemPaths(type, itemId);
  redirect(collectionPath);
}

type RecordCopyActionInput = {
  itemId: string;
  action: CopyAction;
  revalidatePaths: string[];
};

export async function recordCopyActionAction(
  input: RecordCopyActionInput,
) {
  try {
    const item = await recordCopyAction(input.itemId, input.action);

    if (!item) {
      throw new Error("Item not found.");
    }
  } catch (error) {
    return toErrorState(error);
  }

  for (const path of input.revalidatePaths) {
    revalidatePath(path);
  }
}
