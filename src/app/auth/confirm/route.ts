import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getServerSupabaseClient } from "@/lib/supabase/server-client";
import { getOptionalAppUser } from "@/server/auth/session";
import { sanitizeNextPath, signOutWorkspaceSession } from "@/server/auth/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const redirectTo = request.nextUrl.clone();

  redirectTo.pathname = nextPath;
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (code || (tokenHash && type)) {
    const supabase = await getServerSupabaseClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          type: type!,
          token_hash: tokenHash!,
        });

    if (!error) {
      const user = await getOptionalAppUser();

      if (user) {
        return NextResponse.redirect(redirectTo);
      }

      await signOutWorkspaceSession();
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set("error", "email_not_allowed");

      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "invalid_link");

  return NextResponse.redirect(redirectTo);
}
