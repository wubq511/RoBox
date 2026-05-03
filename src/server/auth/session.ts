import { cache } from "react";
import { redirect } from "next/navigation";

import { getServerSupabaseClient } from "@/lib/supabase/server-client";

import { isAllowedWorkspaceEmail, sanitizeNextPath } from "./service";

const DEFAULT_NEXT_PATH = "/dashboard";

export interface AppUser {
  id: string;
  email: string;
}

function buildLoginRedirect(nextPath?: string, reason?: string) {
  const searchParams = new URLSearchParams({
    next: sanitizeNextPath(nextPath),
  });

  if (reason) {
    searchParams.set("error", reason);
  }

  return `/login?${searchParams.toString()}`;
}

const readSessionEmail = cache(async function readSessionEmail() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const claims = data.claims as Record<string, unknown>;
  const claimEmail =
    typeof claims.email === "string" ? claims.email.toLowerCase() : null;

  if (claimEmail) {
    return {
      id: String(claims.sub),
      email: claimEmail,
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user?.email) {
    return null;
  }

  return {
    id: userData.user.id,
    email: userData.user.email.toLowerCase(),
  };
});

export async function getOptionalAppUser(): Promise<AppUser | null> {
  const user = await readSessionEmail();

  if (!user || !isAllowedWorkspaceEmail(user.email)) {
    return null;
  }

  return user;
}

export async function requireAppUser(nextPath = DEFAULT_NEXT_PATH) {
  const user = await getOptionalAppUser();

  if (!user) {
    redirect(buildLoginRedirect(nextPath));
  }

  return user;
}
