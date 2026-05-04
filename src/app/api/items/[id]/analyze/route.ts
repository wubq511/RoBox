import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { getAppOrigin } from "@/lib/env";
import { getOptionalAppUser } from "@/server/auth/session";
import { analyzeStoredItem } from "@/server/analyze/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getErrorMessage(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : "Analyze failed.";
  }

  return "Smart analyze failed. Please try again.";
}

function getErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return 422;
}

function revalidateItemPaths(type: "prompt" | "skill", itemId: string) {
  const collectionPath = type === "prompt" ? "/prompts" : "/skills";

  revalidatePath("/dashboard");
  revalidatePath(collectionPath);
  revalidatePath(`${collectionPath}/${itemId}`);
}

export async function POST(request: Request, context: RouteContext) {
  const origin = request.headers.get("origin");

  if (origin && origin !== getAppOrigin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getOptionalAppUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = checkRateLimit(request, 30, 3_600_000);

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await context.params;

  try {
    const item = await analyzeStoredItem(id);
    revalidateItemPaths(item.type, item.id);

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}
