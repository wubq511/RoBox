import { getServerSupabaseClient } from "@/lib/supabase/server-client";
import { getServerEnv } from "@/lib/env";

import { isEmailAllowed, parseAllowedEmails } from "./allowlist";

const DEFAULT_NEXT_PATH = "/dashboard";

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}

export function buildAuthRedirectUrl(origin: string, nextPath?: string) {
  const safeNextPath = sanitizeNextPath(nextPath);

  return `${origin}/auth/confirm?next=${encodeURIComponent(safeNextPath)}`;
}

export function getAllowedEmails() {
  return parseAllowedEmails(getServerEnv("ALLOWED_EMAILS"));
}

export function hasAllowedEmails() {
  return getAllowedEmails().length > 0;
}

export function isAllowedWorkspaceEmail(email: string) {
  return isEmailAllowed(email, getAllowedEmails());
}

export async function requestMagicLink(options: {
  email: string;
  origin: string;
  nextPath?: string;
}) {
  const email = options.email.trim().toLowerCase();

  if (!email) {
    return {
      ok: false as const,
      code: "missing_email",
    };
  }

  if (!hasAllowedEmails()) {
    return {
      ok: false as const,
      code: "allowlist_not_configured",
    };
  }

  if (!isAllowedWorkspaceEmail(email)) {
    return {
      ok: false as const,
      code: "email_not_allowed",
    };
  }

  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildAuthRedirectUrl(options.origin, options.nextPath),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      ok: false as const,
      code: "auth_request_failed",
    };
  }

  return {
    ok: true as const,
    email,
  };
}

export async function signOutWorkspaceSession() {
  const supabase = await getServerSupabaseClient();

  await supabase.auth.signOut();
}
