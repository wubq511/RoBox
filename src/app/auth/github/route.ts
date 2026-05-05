import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getAppOrigin } from "@/lib/env";
import { buildAuthRedirectUrl, sanitizeNextPath } from "@/server/auth/service";

function readEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const origin =
    request.headers.get("origin") ??
    (() => {
      const host =
        request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        null;
      const protocol = request.headers.get("x-forwarded-proto") ?? "http";
      return host ? `${protocol}://${host}` : null;
    })() ??
    getAppOrigin();

  let supabaseResponse = NextResponse.next({ request });

  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: buildAuthRedirectUrl(origin, nextPath),
    },
  });

  if (error || !data.url) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "oauth_request_failed");
    return NextResponse.redirect(loginUrl);
  }

  const redirectResponse = NextResponse.redirect(data.url);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });

  return redirectResponse;
}
