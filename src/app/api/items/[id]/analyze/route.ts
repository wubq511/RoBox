import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { analyzeStoredItem } from "@/server/analyze/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Analyze failed.";
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

export async function POST(_request: Request, context: RouteContext) {
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
