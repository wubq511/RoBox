import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPromptAction,
  createSkillAction,
  deleteItemAction,
  initialItemFormState,
  recordCopyActionAction,
  toggleFavoriteAction,
  updatePromptAction,
  updateSkillAction,
} from "./actions";

const redirectError = new Error("NEXT_REDIRECT");

const {
  createItemMock,
  deleteItemMock,
  recordCopyActionMock,
  replacePromptVariablesMock,
  toggleFavoriteMock,
  updateItemMock,
  revalidatePathMock,
  redirectMock,
} = vi.hoisted(() => ({
  createItemMock: vi.fn(),
  deleteItemMock: vi.fn(),
  recordCopyActionMock: vi.fn(),
  replacePromptVariablesMock: vi.fn(),
  toggleFavoriteMock: vi.fn(),
  updateItemMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/server/db/items", () => ({
  createItem: createItemMock,
  deleteItem: deleteItemMock,
  recordCopyAction: recordCopyActionMock,
  replacePromptVariables: replacePromptVariablesMock,
  toggleFavorite: toggleFavoriteMock,
  updateItem: updateItemMock,
}));

describe("item server actions", () => {
  beforeEach(() => {
    createItemMock.mockReset();
    deleteItemMock.mockReset();
    recordCopyActionMock.mockReset();
    replacePromptVariablesMock.mockReset();
    toggleFavoriteMock.mockReset();
    updateItemMock.mockReset();
    revalidatePathMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation(() => {
      throw redirectError;
    });
  });

  it("exposes the planned initial form state shape", () => {
    expect(initialItemFormState).toEqual({
      status: "idle",
      message: "",
    });
  });

  it("creates a prompt and replaces prompt variables before redirecting", async () => {
    createItemMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
    });
    replacePromptVariablesMock.mockResolvedValue([]);

    const formData = new FormData();
    formData.set("title", "Prompt title");
    formData.set("summary", "Summary");
    formData.set("content", "Prompt content");
    formData.set("category", "Coding");
    formData.set("tags", "ts, agent");
    formData.set(
      "variables",
      JSON.stringify([
        {
          name: "language",
          description: "",
          defaultValue: "TypeScript",
          required: false,
          sortOrder: 0,
        },
      ]),
    );

    await expect(
      createPromptAction(initialItemFormState, formData),
    ).rejects.toThrow(redirectError);

    expect(createItemMock).toHaveBeenCalledWith({
      type: "prompt",
      title: "Prompt title",
      summary: "Summary",
      content: "Prompt content",
      category: "Coding",
      tags: ["ts", "agent"],
      sourceUrl: "",
    });
    expect(replacePromptVariablesMock).toHaveBeenCalledWith("prompt-1", [
      {
        name: "language",
        description: "",
        defaultValue: "TypeScript",
        required: false,
        sortOrder: 0,
      },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts/prompt-1");
    expect(redirectMock).toHaveBeenCalledWith("/prompts/prompt-1");
  });

  it("creates a skill without replacing variables", async () => {
    createItemMock.mockResolvedValue({
      id: "skill-1",
      type: "skill",
    });

    const formData = new FormData();
    formData.set("title", "Skill title");
    formData.set("content", "Skill content");
    formData.set("variables", JSON.stringify([{ name: "ignored" }]));

    await expect(
      createSkillAction(initialItemFormState, formData),
    ).rejects.toThrow(redirectError);

    expect(createItemMock).toHaveBeenCalledWith({
      type: "skill",
      title: "Skill title",
      summary: "",
      content: "Skill content",
      category: "Other",
      tags: [],
      sourceUrl: "",
    });
    expect(replacePromptVariablesMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills");
    expect(redirectMock).toHaveBeenCalledWith("/skills/skill-1");
  });

  it("updates a prompt via bound item id and rewrites prompt variables", async () => {
    updateItemMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
    });
    replacePromptVariablesMock.mockResolvedValue([]);

    const formData = new FormData();
    formData.set("title", "Updated prompt");
    formData.set("content", "Updated content");
    formData.set("variables", JSON.stringify([{ name: "project" }]));

    await expect(
      updatePromptAction("prompt-1", initialItemFormState, formData),
    ).rejects.toThrow(redirectError);

    expect(updateItemMock).toHaveBeenCalledWith("prompt-1", {
      title: "Updated prompt",
      summary: "",
      content: "Updated content",
      category: "Other",
      tags: [],
      sourceUrl: "",
    });
    expect(replacePromptVariablesMock).toHaveBeenCalledWith("prompt-1", [
      {
        name: "project",
        description: "",
        defaultValue: "",
        required: false,
        sortOrder: 0,
      },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts/prompt-1");
    expect(redirectMock).toHaveBeenCalledWith("/prompts/prompt-1");
  });

  it("updates a skill via bound item id without touching variables", async () => {
    updateItemMock.mockResolvedValue({
      id: "skill-1",
      type: "skill",
    });

    const formData = new FormData();
    formData.set("title", "Updated skill");
    formData.set("content", "Updated content");
    formData.set("variables", JSON.stringify([{ name: "ignored" }]));

    await expect(
      updateSkillAction("skill-1", initialItemFormState, formData),
    ).rejects.toThrow(redirectError);

    expect(updateItemMock).toHaveBeenCalledWith("skill-1", {
      title: "Updated skill",
      summary: "",
      content: "Updated content",
      category: "Other",
      tags: [],
      sourceUrl: "",
    });
    expect(replacePromptVariablesMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills/skill-1");
    expect(redirectMock).toHaveBeenCalledWith("/skills/skill-1");
  });

  it("returns an error state instead of throwing on create failure", async () => {
    createItemMock.mockRejectedValue(new Error("db down"));

    const formData = new FormData();
    formData.set("title", "Prompt title");
    formData.set("content", "Prompt content");

    await expect(
      createPromptAction(initialItemFormState, formData),
    ).resolves.toEqual({
      status: "error",
      message: "db down",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("toggles favorite, revalidates paths, and does not redirect", async () => {
    toggleFavoriteMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
    });

    const formData = new FormData();
    formData.set("itemId", "prompt-1");
    formData.set("type", "prompt");
    formData.set("redirectTo", "/prompts/prompt-1");

    await expect(toggleFavoriteAction(formData)).resolves.toBeUndefined();

    expect(toggleFavoriteMock).toHaveBeenCalledWith("prompt-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts/prompt-1");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("deletes an item, revalidates, and redirects to the list page", async () => {
    deleteItemMock.mockResolvedValue({
      id: "skill-1",
      type: "skill",
    });

    const formData = new FormData();
    formData.set("itemId", "skill-1");
    formData.set("type", "skill");

    await expect(
      deleteItemAction(initialItemFormState, formData),
    ).rejects.toThrow(redirectError);

    expect(deleteItemMock).toHaveBeenCalledWith("skill-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills");
    expect(revalidatePathMock).toHaveBeenCalledWith("/skills/skill-1");
    expect(redirectMock).toHaveBeenCalledWith("/skills");
  });

  it("records raw copy usage from a plain input object and does not redirect", async () => {
    recordCopyActionMock.mockResolvedValue({
      id: "prompt-1",
      type: "prompt",
    });

    await expect(
      recordCopyActionAction({
        itemId: "prompt-1",
        action: "copy_raw",
        revalidatePaths: ["/dashboard", "/prompts", "/prompts/prompt-1"],
      }),
    ).resolves.toBeUndefined();

    expect(recordCopyActionMock).toHaveBeenCalledWith("prompt-1", "copy_raw");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts");
    expect(revalidatePathMock).toHaveBeenCalledWith("/prompts/prompt-1");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported phase 3 copy actions with the planned state shape", async () => {
    await expect(
      recordCopyActionAction({
        itemId: "prompt-1",
        action: "copy_final" as "copy_raw",
        revalidatePaths: ["/prompts/prompt-1"],
      }),
    ).resolves.toEqual({
      status: "error",
      message: "Phase 3 only supports copy_raw.",
    });
    expect(recordCopyActionMock).not.toHaveBeenCalled();
  });
});
