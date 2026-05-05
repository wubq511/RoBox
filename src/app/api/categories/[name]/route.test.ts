import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteUserCategoryMock,
  forceDeleteUserCategoryMock,
  getOptionalAppUserMock,
  getAppOriginMock,
  getUserCategoryNamesMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  deleteUserCategoryMock: vi.fn(),
  forceDeleteUserCategoryMock: vi.fn(),
  getOptionalAppUserMock: vi.fn(),
  getAppOriginMock: vi.fn(),
  getUserCategoryNamesMock: vi.fn(),
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
  deleteUserCategory: deleteUserCategoryMock,
  forceDeleteUserCategory: forceDeleteUserCategoryMock,
  getUserCategoryNames: getUserCategoryNamesMock,
}));

import { DELETE } from "./route";

describe("DELETE /api/categories/:name", () => {
  beforeEach(() => {
    deleteUserCategoryMock.mockReset();
    forceDeleteUserCategoryMock.mockReset();
    getOptionalAppUserMock.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    });
    getAppOriginMock.mockReturnValue("http://localhost:3000");
    getUserCategoryNamesMock.mockResolvedValue(["Coding", "Other"]);
    revalidatePathMock.mockReset();
  });

  it("rejects force delete when the replacement category is not owned by the user", async () => {
    deleteUserCategoryMock.mockResolvedValue({
      deleted: false,
      usageCount: 2,
    });

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/categories/Coding?type=prompt", {
        method: "DELETE",
        headers: { "x-replacement-category": "Injected" },
      }),
      { params: Promise.resolve({ name: "Coding" }) },
    );

    expect(response.status).toBe(400);
    expect(forceDeleteUserCategoryMock).not.toHaveBeenCalled();
  });

  it("migrates items only to an existing category in the same type", async () => {
    deleteUserCategoryMock.mockResolvedValue({
      deleted: false,
      usageCount: 2,
    });

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/categories/Coding?type=prompt", {
        method: "DELETE",
        headers: { "x-replacement-category": "Other" },
      }),
      { params: Promise.resolve({ name: "Coding" }) },
    );

    expect(response.status).toBe(200);
    expect(forceDeleteUserCategoryMock).toHaveBeenCalledWith(
      "user-1",
      "prompt",
      "Coding",
      "Other",
    );
  });
});
