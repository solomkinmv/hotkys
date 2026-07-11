import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("user content database limits", () => {
  const schema = fs.readFileSync(
    path.join(process.cwd(), "supabase/schema.sql"),
    "utf8",
  );

  it("enforces per-user row quotas for every user-created collection", () => {
    expect(schema).toContain("custom_apps_user_quota");
    expect(schema).toContain("custom_keymaps_user_quota");
    expect(schema).toContain("custom_sections_user_quota");
    expect(schema).toContain("custom_shortcuts_user_quota");
    expect(schema).toContain("favorites_user_quota");
    expect(schema).toContain("2000");
    expect(schema).toContain("500");
  });

  it("enforces persisted text lengths and stable shortcut identities", () => {
    expect(schema).toContain("custom_apps_slug_format");
    expect(schema).toContain("custom_apps_resource_locations");
    expect(schema).toContain("[[:cntrl:]]");
    expect(schema).toContain("custom_shortcuts_text_lengths");
    expect(schema).toContain("favorites_text_lengths");
    expect(schema).toContain("base_shortcut_id TEXT");
    expect(schema).toContain(
      "platforms <@ ARRAY['macos', 'windows', 'linux']::TEXT[]",
    );
  });
});
