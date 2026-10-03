import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "");
const migration = read("../migrations/20261003203001_custom_app_windows_identifiers.sql");
const alice = "00000000-0000-0000-0000-000000000001";
const bob = "00000000-0000-0000-0000-000000000002";

for (const mode of ["schema", "migration"]) {
  test(`custom Windows identifiers (${mode})`, async (t) => {
    const db = new PGlite();
    t.after(() => db.close());
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid);
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
        $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
      GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    `);
    if (mode === "migration") {
      await db.exec(read("./fixtures/schema-before-remediation.sql"));
      await db.exec(read("../migrations/20260907211100_restrict_clerk_oauth_permissions.sql"));
    } else {
      await db.exec(read("../schema.sql"));
      await db.exec(read("../schema.sql"));
    }
    await db.query("INSERT INTO profiles(id,clerk_user_id) VALUES ($1,'alice'),($2,'bob')", [alice,bob]);
    await db.query("INSERT INTO custom_apps(id,user_id,slug,name,bundle_id) VALUES ($1,$1,'my-editor','My Editor','com.microsoft.VSCode'),($2,$2,'other','Other',NULL)", [alice,bob]);
    if (mode === "migration") await db.exec(migration);
    await db.exec(migration);

    assert.deepEqual((await db.query("SELECT name,bundle_id,windows_app_id,windows_process_name FROM custom_apps WHERE id=$1", [alice])).rows, [{
      name: "My Editor", bundle_id: "com.microsoft.VSCode", windows_app_id: null, windows_process_name: null,
    }]);

    async function asUser(role, sub, run) {
      await db.exec("BEGIN");
      try {
        await db.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub, iss: "https://clerk.hotkys.com" })]);
        await db.exec(`SET LOCAL ROLE ${role}`);
        await run();
      } finally { await db.exec("ROLLBACK"); }
    }

    await t.test("owner saves, reads, and clears identifiers without changing the app name", () => asUser("authenticated", "alice", async () => {
      await db.query("UPDATE custom_apps SET windows_app_id='Vendor.Package!App',windows_process_name='Code' WHERE id=$1", [alice]);
      assert.deepEqual((await db.query("SELECT name,windows_app_id,windows_process_name FROM custom_apps WHERE id=$1", [alice])).rows, [{ name: "My Editor", windows_app_id: "Vendor.Package!App", windows_process_name: "Code" }]);
      await db.query("UPDATE custom_apps SET windows_app_id=NULL,windows_process_name=NULL WHERE id=$1", [alice]);
      assert.deepEqual((await db.query("SELECT windows_app_id,windows_process_name FROM custom_apps WHERE id=$1", [alice])).rows, [{ windows_app_id: null, windows_process_name: null }]);
    }));

    await t.test("Raycast OAuth reads only its owner's identifiers", async () => {
      await db.query("UPDATE custom_apps SET windows_app_id='Vendor.Package!App',windows_process_name='Code' WHERE id=$1", [alice]);
      await asUser("anon", "alice", async () => {
        assert.deepEqual((await db.query("SELECT windows_app_id,windows_process_name FROM custom_apps")).rows, [{ windows_app_id: "Vendor.Package!App", windows_process_name: "Code" }]);
        await assert.rejects(() => db.query("UPDATE custom_apps SET windows_process_name='Other' RETURNING id"), { code: "42501" });
      });
      await asUser("authenticated", "bob", async () => {
        assert.deepEqual((await db.query("SELECT id FROM custom_apps WHERE id=$1", [alice])).rows, []);
        assert.deepEqual((await db.query("UPDATE custom_apps SET windows_process_name='Other' WHERE id=$1 RETURNING id", [alice])).rows, []);
      });
    });

    for (const [field, values] of [
      ["windows_app_id", ["", "   ", "x".repeat(256), "Vendor\nApp", "Vendor\u007fApp"]],
      ["windows_process_name", ["", "Code.exe", "CODE.EXE", "../Code", "Code..App", "C:\\Code", "Code\n", "Code\r", "x".repeat(101), "$(Code)"]],
    ]) {
      for (const value of values) await t.test(`rejects invalid ${field} ${JSON.stringify(value)}`, async () => {
        await assert.rejects(() => db.query(`UPDATE custom_apps SET ${field}=$1 WHERE id=$2`, [value,alice]), { code: "23514" });
      });
    }
    await t.test("accepts bounded IDs and process names and preserves them on migration rerun", async () => {
      await db.query("UPDATE custom_apps SET windows_app_id=$1,windows_process_name=$2 WHERE id=$3", ["x".repeat(255),"x".repeat(100),alice]);
      await db.exec(migration);
      assert.deepEqual((await db.query("SELECT windows_app_id,windows_process_name FROM custom_apps WHERE id=$1", [alice])).rows, [{ windows_app_id: "x".repeat(255), windows_process_name: "x".repeat(100) }]);
    });
  });
}
