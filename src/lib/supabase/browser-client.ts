import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, publishableKey } = getSupabasePublicEnv();

    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}
