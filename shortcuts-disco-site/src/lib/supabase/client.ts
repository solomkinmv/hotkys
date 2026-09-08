import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import { getCurrentAuthUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
let accessTokenProvider: (() => Promise<string | null>) | null = null;
let generation = 0;
const userGenerations = new WeakMap<AuthUser, number>();
export function setSupabaseAccessTokenProvider(provider: (() => Promise<string | null>) | null) {
  generation++;
  accessTokenProvider = provider;
}
export function bindAuthUser(user: AuthUser | null) { if (user) userGenerations.set(user, generation); }
export function createClient(authUser?: AuthUser | null) {
  const user = authUser === undefined ? getCurrentAuthUser() : authUser;
  const capturedGeneration = generation;
  const provider = accessTokenProvider;
  const assertCurrent = () => {
    if (generation !== capturedGeneration || (user && userGenerations.get(user) !== capturedGeneration)) throw new Error("Session changed. Please retry.");
  };
  assertCurrent();
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    accessToken: async () => { assertCurrent(); const token = await provider?.() ?? null; assertCurrent(); return token; },
    global: { fetch: (input, init) => { assertCurrent(); return fetch(input, init); } },
  });
}
export function createClientOrNull(authUser?: AuthUser | null) {
  return isSupabaseConfigured() ? createClient(authUser) : null;
}
