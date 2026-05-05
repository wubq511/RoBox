import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/env";
import { itemTypeSchema } from "@/lib/schema/items";
import { getOptionalAppUser } from "@/server/auth/session";
import {
  deleteUserCategory,
  forceDeleteUserCategory,
  getUserCategoryNames,
} from "@/server/db/categories";

type RouteContext = {
  params: Promise<{
    name: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const origin = request.headers.get("origin");

  if (origin && origin !== getAppOrigin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getOptionalAppUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name: encodedName } = await context.params;
  const name = decodeURIComponent(encodedName);

  if (!name) {
    return NextResponse.json(
      { error: "Missing category name" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  if (!typeParam) {
    return NextResponse.json(
      { error: "Missing required query parameter: type" },
      { status: 400 },
    );
  }

  const parsedType = itemTypeSchema.safeParse(typeParam);

  if (!parsedType.success) {
    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 },
    );
  }

  const type = parsedType.data;
  const categoryNames = await getUserCategoryNames(user.id, type);

  if (categoryNames.length <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last category" },
      { status: 400 },
    );
  }

  const result = await deleteUserCategory(user.id, type, name);

  if (!result.deleted) {
    const replacement = request.headers.get("x-replacement-category");

    if (!replacement) {
      return NextResponse.json(
        {
          error: "Category is in use",
          usageCount: result.usageCount,
          requiresReplacement: true,
        },
        { status: 409 },
      );
    }

    await forceDeleteUserCategory(user.id, type, name, replacement);
  }

  revalidatePath("/settings");
  revalidatePath(type === "prompt" ? "/prompts" : "/skills");

  return NextResponse.json({ deleted: true });
}
