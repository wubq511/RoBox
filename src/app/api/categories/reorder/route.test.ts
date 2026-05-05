import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getOptionalAppUserMock,
  getAppOriginMock,
  getUserCategoryNamesMock,
  reorderUserCategoriesMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getOptionalAppUserMock: vi.fn(),
  getAppOriginMock: vi.fn(),
  getUserCategoryNamesMock: vi.fn(),
  reorderUserCategoriesMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/env", () => ({
  getAppOrigin: getAppOriginMock,
}));

vi.mock("@/server/auth/session", () => ({
  getOptionalAppUser: getOptionalAppUserMock,
}));

vi.mock("@/server/db/categories", () => ({
  getUserCategoryNames: getUserCategoryNamesMock,
  reorderUserCategories: reorderUserCategoriesMock,
}));

import { PATCH } from "./route";

describe("PATCH /api/categories/reorder", () => {
  beforeEach(() => {
    getOptionalAppUserMock.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    });
    getAppOriginMock.mockReturnValue("http://localhost:3000");
    getUserCategoryNamesMock.mockResolvedValue(["Coding", "Other"]);
    reorderUserCategoriesMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("rejects a reorder payload that omits or duplicates existing categories", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost:3000/api/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({
          type: "prompt",
          orderedNames: ["Coding", "Coding"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(reorderUserCategoriesMock).not.toHaveBeenCalled();
  });

  it("reorders only when every existing category appears exactly once", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost:3000/api/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({
          type: "prompt",
          orderedNames: [" Other ", "Coding"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(reorderUserCategoriesMock).toHaveBeenCalledWith("user-1", "prompt", [
      "Other",
      "Coding",
    ]);
  });
});
