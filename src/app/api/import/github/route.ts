import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { getAppOrigin } from "@/lib/env";
import { getOptionalAppUser } from "@/server/auth/session";
import { createGithubSkillImport } from "@/server/import/github";

function getErrorMessage(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : "GitHub import failed.";
  }

  return "GitHub import failed. Please try again.";
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

const MAX_URL_LENGTH = 2048;

async function readRequestBody(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > 4096) {
    return null;
  }

  try {
    return (await request.json()) as { url?: unknown };
  } catch {
    return {};
  }
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

  const { allowed } = checkRateLimit(request, 10, 3_600_000);

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await readRequestBody(request);

    if (!body) {
      return NextResponse.json(
        { error: "Request body too large." },
        { status: 413 },
      );
    }

    const url = typeof body.url === "string" ? body.url : "";

    if (url.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { error: "URL is too long." },
        { status: 422 },
      );
    }

    const result = await createGithubSkillImport({ url });

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
