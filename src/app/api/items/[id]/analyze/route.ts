import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { getAppOrigin } from "@/lib/env";
import { getOptionalAppUser } from "@/server/auth/session";
import { analyzeStoredItem } from "@/server/analyze/service";
import {
  getAnalyzeClientError,
  getAnalyzeErrorStatus,
  getAnalyzeLogFields,
} from "@/server/analyze/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function revalidateItemPaths(type: "prompt" | "skill" | "tool", itemId: string) {
  const collectionPath =
    type === "prompt" ? "/prompts" : type === "skill" ? "/skills" : "/tools";

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

    return NextResponse.json({ item }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[analyze] failed", getAnalyzeLogFields(id, error));
    }

    return NextResponse.json(
      getAnalyzeClientError(error),
      {
        status: getAnalyzeErrorStatus(error),
      },
    );
  }
}
