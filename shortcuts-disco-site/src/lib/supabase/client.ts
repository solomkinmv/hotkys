import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";

let browserClient: SupabaseClient | null = null;
let accessTokenProvider: (() => Promise<string | null>) | null = null;

export function setSupabaseAccessTokenProvider(
  provider: (() => Promise<string | null>) | null
) {
  accessTokenProvider = provider;
}

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  if (browserClient) {
    return browserClient;
  }

  browserClient = createSupabaseClient(supabaseUrl, supabaseKey, {
    accessToken: async () => {
      return accessTokenProvider?.() ?? null;
    },
  });
  return browserClient;
}

export function createClientOrNull() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient();
}
