import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppOrigin } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { aiSearchRequestSchema } from "@/lib/schema/ai-search";
import { getOptionalAppUser } from "@/server/auth/session";
import {
  getAiSearchClientError,
  getAiSearchErrorStatus,
  getAiSearchLogFields,
} from "@/server/search/errors";
import { runAiSearch } from "@/server/search/service";

async function readRequestBody(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > 8192) {
    return null;
  }

  try {
    return (await request.json()) as unknown;
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

  const { allowed } = checkRateLimit(request, 30, 3_600_000);

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await readRequestBody(request);

  if (!body) {
    return NextResponse.json(
      { error: "Request body too large." },
      { status: 413 },
    );
  }

  const parsed = aiSearchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid AI search request.", code: "invalid_ai_search_request" },
      { status: 422 },
    );
  }

  try {
    const result = await runAiSearch(parsed.data, { userId: user.id });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[ai-search] failed", getAiSearchLogFields(error));
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid AI search request.", code: "invalid_ai_search_request" },
        { status: 422 },
      );
    }

    return NextResponse.json(getAiSearchClientError(error), {
      status: getAiSearchErrorStatus(error),
    });
  }
}
