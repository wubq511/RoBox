import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/env";
import { itemTypeSchema } from "@/lib/schema/items";
import { getOptionalAppUser } from "@/server/auth/session";
import {
  createUserCategory,
  ensureDefaultCategories,
  getUserCategories,
} from "@/server/db/categories";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  if (origin && origin !== getAppOrigin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getOptionalAppUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  await ensureDefaultCategories(user.id);

  const categories = await getUserCategories(user.id, parsedType.data);

  return NextResponse.json(
    { categories },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
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

  if (!body || typeof body !== "object" || !("type" in body) || !("name" in body)) {
    return NextResponse.json(
      { error: "Missing required fields: type, name" },
      { status: 400 },
    );
  }

  const parsedType = itemTypeSchema.safeParse((body as Record<string, unknown>).type);

  if (!parsedType.success) {
    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 },
    );
  }

  const name = String((body as Record<string, unknown>).name).trim();

  if (!name || name.length > 32) {
    return NextResponse.json(
      { error: "Category name must be 1-32 characters" },
      { status: 400 },
    );
  }

  try {
    const category = await createUserCategory(user.id, parsedType.data, name);

    revalidatePath("/settings");
    revalidatePath(parsedType.data === "prompt" ? "/prompts" : "/skills");

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 },
      );
    }

    throw error;
  }
}
