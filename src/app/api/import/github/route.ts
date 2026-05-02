import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createGithubSkillImport } from "@/server/import/github";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "GitHub import failed.";
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

function revalidateSkillImportPaths(itemId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/skills");
  revalidatePath(`/skills/${itemId}`);
}

async function readRequestBody(request: Request) {
  try {
    return (await request.json()) as { url?: unknown };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    const result = await createGithubSkillImport({
      url: typeof body.url === "string" ? body.url : "",
    });

    revalidateSkillImportPaths(result.item.id);

    return NextResponse.json(result, {
      status: 201,
    });
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
