"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAppOrigin } from "@/lib/env";

import { requestMagicLink, sanitizeNextPath, signOutWorkspaceSession } from "./service";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function resolveRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? null;
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return getAppOrigin();
}

export async function requestMagicLinkAction(formData: FormData) {
  const nextPath = sanitizeNextPath(getFormValue(formData, "next"));
  const email = getFormValue(formData, "email");
  const origin = await resolveRequestOrigin();

  const result = await requestMagicLink({
    email,
    origin,
    nextPath,
  });

  const searchParams = new URLSearchParams({
    next: nextPath,
    email,
  });

  if (result.ok) {
    searchParams.set("sent", "1");
    searchParams.set("email", result.email);
    redirect(`/login?${searchParams.toString()}`);
  }

  searchParams.set("error", result.code);
  redirect(`/login?${searchParams.toString()}`);
}

export async function signOutAction() {
  await signOutWorkspaceSession();
  redirect("/login?signed_out=1");
}
