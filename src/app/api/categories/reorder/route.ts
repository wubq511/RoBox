import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/env";
import { itemTypeSchema } from "@/lib/schema/items";
import { getOptionalAppUser } from "@/server/auth/session";
import {
  getUserCategoryNames,
  reorderUserCategories,
} from "@/server/db/categories";

export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");

  if (origin && origin !== getAppOrigin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getOptionalAppUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("type" in body) ||
    !("orderedNames" in body)
  ) {
    return NextResponse.json(
      { error: "Missing required fields: type, orderedNames" },
      { status: 400 },
    );
  }

  const parsedType = itemTypeSchema.safeParse(
    (body as Record<string, unknown>).type,
  );

  if (!parsedType.success) {
    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 },
    );
  }

  const orderedNames = (body as Record<string, unknown>).orderedNames;

  if (
    !Array.isArray(orderedNames) ||
    orderedNames.some((n) => typeof n !== "string")
  ) {
    return NextResponse.json(
      { error: "orderedNames must be an array of strings" },
      { status: 400 },
    );
  }

  const currentNames = await getUserCategoryNames(user.id, parsedType.data);
  const normalizedOrderedNames = orderedNames.map((name) => name.trim());
  const uniqueOrderedNames = new Set(normalizedOrderedNames);

  if (
    uniqueOrderedNames.size !== currentNames.length ||
    normalizedOrderedNames.length !== currentNames.length ||
    currentNames.some((name) => !uniqueOrderedNames.has(name))
  ) {
    return NextResponse.json(
      { error: "orderedNames must include each existing category exactly once" },
      { status: 400 },
    );
  }

  await reorderUserCategories(user.id, parsedType.data, normalizedOrderedNames);

  revalidatePath("/settings");

  return NextResponse.json({ ok: true });
}
