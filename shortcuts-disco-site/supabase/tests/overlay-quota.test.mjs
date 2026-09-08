import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8").replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "");
const legacy = readFileSync(new URL("fixtures/schema-before-remediation.sql", import.meta.url), "utf8").replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "");
const dir = new URL("../migrations/", import.meta.url);
const upgrades = readdirSync(dir).filter(name => /stable_custom_favorite|explicit_overlay|authoring_structure/.test(name)).sort().map(name => readFileSync(new URL(name, dir), "utf8"));
const alice = "00000000-0000-0000-0000-000000000001";
const bob = "00000000-0000-0000-0000-000000000002";
for (const mode of ["schema", "upgrade"]) test(`authoring and overlay contracts (${mode})`, async t => {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;`);
  await db.exec(mode === "schema" ? schema : legacy);
  await db.exec(`INSERT INTO profiles(id,clerk_user_id) VALUES ('${alice}','alice'),('${bob}','bob');
    INSERT INTO custom_apps(id,user_id,slug,name) VALUES ('${alice}','${alice}','one','One'),('${bob}','${bob}','two','Two');
    INSERT INTO custom_keymaps(id,user_id,custom_app_id,title) VALUES ('${alice}','${alice}','${alice}','Default'),('${bob}','${bob}','${bob}','Default');
    INSERT INTO custom_sections(id,keymap_id,title) VALUES ('${alice}','${alice}','General'),('${bob}','${bob}','General');
    INSERT INTO custom_shortcuts(id,user_id,section_id,title,key) VALUES ('${alice}','${alice}','${alice}','Copy','cmd+c'),('${bob}','${bob}','${bob}','Copy','cmd+c');
    INSERT INTO favorites(user_id,item_type,app_slug,custom_app_id,keymap_title,section_title,shortcut_title) VALUES ('${alice}','shortcut','custom-one','${alice}','Default','General','Copy');`);
  if (mode === "upgrade") for (const sql of upgrades) await db.exec(sql);
  else await db.exec(schema);
  assert.equal((await db.query(`SELECT custom_shortcut_id FROM favorites WHERE user_id = '${alice}'`)).rows[0].custom_shortcut_id, alice);
  await t.test("preserves old fields and rejects contradictory clear flags", async () => {
    const row = (await db.query(`SELECT key,key_is_cleared,comment_is_cleared FROM custom_shortcuts WHERE id='${alice}'`)).rows[0];
    assert.deepEqual(row, { key: "cmd+c", key_is_cleared: false, comment_is_cleared: false });
    await assert.rejects(db.exec(`UPDATE custom_shortcuts SET key_is_cleared=true WHERE id='${alice}'`), /custom_shortcuts_clear_fields/);
    await db.exec(`INSERT INTO custom_shortcuts(user_id,base_app_slug,base_keymap_title,base_section_title,base_shortcut_title,base_shortcut_id,title,key_is_cleared,comment) VALUES ('${alice}','app','Default','General','Copy','identity','Copy',true,'Use menu')`);
  });
  await t.test("rejects cross-account references and preserves atomic reorder permissions", async () => {
    await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"alice"}',false);`);
    try {
      await assert.rejects(db.exec(`INSERT INTO favorites(user_id,item_type,custom_shortcut_id) VALUES ('${alice}','shortcut','${bob}')`), /row-level security/);
      await assert.rejects(db.exec(`SELECT reorder_custom_items('shortcuts',ARRAY['${alice}'::uuid,'${bob}'::uuid])`), /missing or inaccessible/);
      assert.equal((await db.query(`SELECT sort_order FROM custom_shortcuts WHERE id='${alice}'`)).rows[0].sort_order, 0);
      await assert.rejects(db.exec(`INSERT INTO custom_keymaps(user_id,custom_app_id,title,platforms) VALUES ('${alice}','${alice}','Invalid',ARRAY['macos','macos'])`), /unique_platforms/);
    } finally { await db.exec("RESET ROLE"); }
    await db.exec(`SET ROLE anon; SELECT set_config('request.jwt.claims','{"iss":"https://clerk.hotkys.com","sub":"alice"}',false);`);
    try { await assert.rejects(db.exec(`SELECT reorder_custom_items('shortcuts',ARRAY['${alice}'::uuid])`), /permission denied/); }
    finally { await db.exec("RESET ROLE"); }
  });
  await t.test("edits at quota without allowing another inserted row", async () => {
    await db.exec(`ALTER TABLE custom_shortcuts DISABLE TRIGGER custom_shortcuts_user_quota;
      INSERT INTO custom_shortcuts(user_id,section_id,title) SELECT '${alice}','${alice}','Row '||n FROM generate_series(1,1998) n;
      ALTER TABLE custom_shortcuts ENABLE TRIGGER custom_shortcuts_user_quota;`);
    assert.equal(Number((await db.query(`SELECT count(*) AS total FROM custom_shortcuts WHERE user_id='${alice}'`)).rows[0].total), 2000);
    await db.exec(`UPDATE custom_shortcuts SET key='cmd+v' WHERE id='${alice}'`);
    await assert.rejects(db.exec(`INSERT INTO custom_shortcuts(user_id,section_id,title) VALUES ('${alice}','${alice}','Over quota')`), /Resource limit/);
  });
  await t.test("renames retain favorite IDs and deleting a shortcut cascades its favorite", async () => {
    await db.exec(`UPDATE custom_shortcuts SET title='Renamed' WHERE id='${alice}'; UPDATE custom_apps SET slug='renamed' WHERE id='${alice}';`);
    assert.equal((await db.query(`SELECT custom_shortcut_id FROM favorites WHERE user_id='${alice}'`)).rows[0].custom_shortcut_id, alice);
    await db.exec(`DELETE FROM custom_shortcuts WHERE id='${alice}'`);
    assert.equal((await db.query(`SELECT * FROM favorites WHERE user_id='${alice}'`)).rows.length, 0);
  });
});

test("upgrade does not guess that public title-only favorites belong to custom rows", async t => {
  const db = new PGlite(); t.after(() => db.close());
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;`);
  await db.exec(legacy);
  await db.exec(`INSERT INTO profiles(id,clerk_user_id) VALUES ('${alice}','alice');
    INSERT INTO custom_keymaps(id,user_id,base_app_slug,title) VALUES ('${alice}','${alice}','safari','Default');
    INSERT INTO custom_sections(id,keymap_id,title) VALUES ('${alice}','${alice}','General');
    INSERT INTO custom_shortcuts(id,user_id,section_id,title,key) VALUES ('${alice}','${alice}','${alice}','Copy','cmd+c');
    INSERT INTO favorites(user_id,item_type,app_slug,keymap_title,section_title,shortcut_title) VALUES ('${alice}','shortcut','safari','Default','General','Copy');
    INSERT INTO favorites(user_id,item_type,app_slug,keymap_title) VALUES ('${alice}','keymap','safari','Default');`);
  for (const sql of upgrades) await db.exec(sql);
  assert.deepEqual((await db.query("SELECT custom_keymap_id, custom_shortcut_id FROM favorites")).rows, [{ custom_keymap_id: null, custom_shortcut_id: null }, { custom_keymap_id: null, custom_shortcut_id: null }]);
  await db.exec(`DELETE FROM custom_keymaps WHERE id='${alice}'`);
  assert.equal((await db.query("SELECT count(*) total FROM favorites")).rows[0].total, 2);
});
