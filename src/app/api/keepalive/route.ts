import { NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/lib/env";

// Supabase free-plan projects are paused after roughly a week without database
// activity, which leaves every authenticated request hanging in middleware
// until Vercel returns MIDDLEWARE_INVOCATION_TIMEOUT (504). The Vercel Cron
// entries in vercel.json call this route twice a day; each call runs one tiny
// read per table so the project keeps registering activity.
export const dynamic = "force-dynamic";

const ACTIVITY_TABLES = ["items", "user_categories", "prompt_variables"] as const;
const ACTIVITY_TIMEOUT_MS = 3000;

export async function GET() {
  const { url, publishableKey } = getSupabasePublicEnv();
  const startedAt = Date.now();
  const checks: Record<string, number | string> = {};

  for (const table of ACTIVITY_TABLES) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(ACTIVITY_TIMEOUT_MS),
      });

      checks[table] = response.status;
    } catch (error) {
      checks[table] = error instanceof Error ? error.name : "unknown_error";
    }
  }

  const ok = ACTIVITY_TABLES.every((table) => checks[table] === 200);

  return NextResponse.json(
    { ok, checks, durationMs: Date.now() - startedAt },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
