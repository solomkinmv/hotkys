export type AuthMode = "public" | "test" | "production" | "auto";
export interface PublicAuthConfig { clerkKey?: string; supabaseUrl?: string; supabaseKey?: string; legacySupabaseKey?: string }
export const productionAuth = { issuer: "https://clerk.hotkys.com", supabaseUrl: "https://pnzstacjwokxqvtxoeyp.supabase.co" };
export function readPublicAuthConfig(): PublicAuthConfig {
  return { clerkKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, legacySupabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
}
export function validateAuthConfig(config: PublicAuthConfig, mode: AuthMode): "public" | "test" | "production" {
  const configured = Object.values(config).some(Boolean);
  if (mode === "auto") mode = !configured ? "public" : config.clerkKey?.startsWith("pk_live_") ? "production" : "test";
  if (mode === "public") { if (configured) throw new Error("Public mode requires all Clerk and Supabase settings to be unset."); return mode; }
  if (!config.clerkKey || !config.supabaseUrl || !(config.supabaseKey || config.legacySupabaseKey)) throw new Error("Account mode requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL, and a Supabase publishable or anon key.");
  if (config.supabaseKey && config.legacySupabaseKey) throw new Error("Set one Supabase public key variable, not both.");
  const prefix = mode === "production" ? "pk_live_" : "pk_test_";
  if (!config.clerkKey.startsWith(prefix)) throw new Error(`Clerk key does not match ${mode} mode.`);
  let domain: string;
  try { domain = atob(config.clerkKey.slice(prefix.length)).replace(/\$$/, ""); if (!/^[a-z0-9.-]+$/i.test(domain) || !domain.includes(".")) throw new Error(); }
  catch { throw new Error("Clerk publishable key has an invalid domain payload."); }
  let url: URL;
  try { url = new URL(config.supabaseUrl); } catch { throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Supabase URL must be an HTTPS origin.");
  const key = config.supabaseKey ?? config.legacySupabaseKey!;
  if (config.supabaseKey && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw new Error("Use a Supabase publishable key. Server secret keys must never be public.");
  if (config.legacySupabaseKey) {
    try { const claims = JSON.parse(atob(key.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); if (claims.role !== "anon") throw new Error(); }
    catch { throw new Error("Legacy Supabase public key must have the anon role."); }
  }
  if (mode === "production" && (`https://${domain}` !== productionAuth.issuer || url.origin !== productionAuth.supabaseUrl)) throw new Error("Production Clerk issuer or Supabase project does not match the checked-in production contract.");
  if (mode === "test" && url.origin === productionAuth.supabaseUrl) throw new Error("Test mode requires a dedicated test Supabase project.");
  return mode;
}
