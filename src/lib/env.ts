import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let localEnvCache: Record<string, string> | null = null;

function loadDotEnvLocal(): Record<string, string> {
  if (localEnvCache) return localEnvCache;

  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    const env: Record<string, string> = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      env[key] = value;
    }

    localEnvCache = env;
    return env;
  } catch {
    return {};
  }
}

export function getServerEnv(name: string): string | undefined {
  return loadDotEnvLocal()[name] ?? process.env[name]?.trim();
}

export function resetLocalEnvCache() {
  localEnvCache = null;
}

function readRequiredEnv(name: string) {
  const value = getServerEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabasePublicEnv() {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function hasSupabasePublicEnv() {
  return Boolean(
    getServerEnv("NEXT_PUBLIC_SUPABASE_URL") &&
      getServerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  );
}

export function getAppOrigin() {
  const configuredOrigin = getServerEnv("NEXT_PUBLIC_APP_ORIGIN");

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_ORIGIN");
}
