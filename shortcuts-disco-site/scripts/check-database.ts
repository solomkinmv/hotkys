import { createClient } from "@supabase/supabase-js";
import type { PublicAuthConfig } from "../src/lib/auth/config-validation";

export async function checkDatabaseSchema(config: PublicAuthConfig) {
  const client = createClient(config.supabaseUrl!, (config.supabaseKey ?? config.legacySupabaseKey)!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (const [table, columns] of [
    ["favorites", "custom_keymap_id,custom_shortcut_id"],
    ["custom_shortcuts", "key_is_cleared,comment_is_cleared"],
    ["custom_keymaps", "sort_order"],
  ]) {
    // Zero rows: verify the deployed API schema without reading private data.
    const { error } = await client.from(table).select(columns).limit(0);
    if (error) throw new Error(`Database schema check failed for ${table} (${error.code}). Verify the pending Supabase migrations before deploying.`);
  }
}
