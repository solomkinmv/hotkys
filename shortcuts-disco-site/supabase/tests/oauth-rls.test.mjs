import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const migrationDir = new URL("../migrations/", import.meta.url);
const originalOAuth = readFileSync(
  new URL("20260730071108_allow_clerk_oauth_rls.sql", migrationDir),
  "utf8",
);
const migrations = readdirSync(migrationDir).filter((name) =>
  name.includes("restrict_clerk_oauth_permissions"),
);
const alice = "00000000-0000-0000-0000-000000000001";
const bob = "00000000-0000-0000-0000-000000000002";
const tables = [
  "profiles",
  "custom_apps",
  "custom_keymaps",
  "custom_sections",
  "custom_shortcuts",
  "favorites",
];

for (const mode of ["schema", "migration"]) {
  test(`Clerk OAuth least privilege (${mode})`, async (t) => {
    const db = new PGlite();
    t.after(() => db.close());
    // Emulate Supabase's roles and auth.jwt(), not its token verifier. PGlite
    // uses real PostgreSQL RLS. Core gen_random_uuid() needs no pgcrypto here.
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid);
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
        $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
      GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    `);
    const executableSchema = schema.replace(
      "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
      "",
    );
    if (mode === "migration") {
      // Start with the previously deployed OAuth policies, retaining the real
      // schema, constraints, triggers and website policies from schema.sql.
      const start = executableSchema.indexOf("-- Clerk OAuth access tokens");
      const end = executableSchema.indexOf(
        "CREATE OR REPLACE FUNCTION public.set_updated_at()",
      );
      assert.ok(start > 0 && end > start);
      await db.exec(
        executableSchema.slice(0, start) +
          originalOAuth +
          executableSchema.slice(end),
      );
      for (const migration of migrations)
        await db.exec(readFileSync(new URL(migration, migrationDir), "utf8"));
    } else {
      await db.exec(executableSchema);
      await db.exec(executableSchema); // SQL-editor reruns must stay restricted.
    }
    for (const [id, name] of [
      [alice, "alice"],
      [bob, "bob"],
    ]) {
      await db.query(
        "INSERT INTO profiles(id, clerk_user_id) VALUES ($1, $2)",
        [id, name],
      );
      await db.query("INSERT INTO user_preferences(user_id) VALUES ($1)", [id]);
      await db.query(
        "INSERT INTO custom_apps(id, user_id, slug, name) VALUES ($1, $1, $2, $2)",
        [id, name],
      );
      await db.query(
        "INSERT INTO custom_keymaps(id, user_id, custom_app_id, title) VALUES ($1, $1, $1, 'keys')",
        [id],
      );
      await db.query(
        "INSERT INTO custom_sections(id, keymap_id, title) VALUES ($1, $1, 'section')",
        [id],
      );
      await db.query(
        "INSERT INTO custom_shortcuts(id, user_id, section_id, title) VALUES ($1, $1, $1, 'shortcut')",
        [id],
      );
      await db.query(
        "INSERT INTO favorites(id, user_id, item_type, custom_app_id) VALUES ($1, $1, 'app', $1)",
        [id],
      );
    }
    async function asUser(role, claims, run) {
      await db.exec("BEGIN");
      try {
        await db.query("SELECT set_config('request.jwt.claims', $1, true)", [
          JSON.stringify(claims),
        ]);
        await db.exec(`SET LOCAL ROLE ${role}`);
        await run();
      } finally {
        await db.exec("ROLLBACK");
      }
    }
    const claims = { iss: "https://clerk.hotkys.com", sub: "alice" };
    const denied = (sql) => assert.rejects(db.query(sql), { code: "42501" });

    await t.test(
      "reads only own profile, nested customizations and favorites",
      () =>
        asUser("anon", claims, async () => {
          for (const table of tables) {
            assert.deepEqual(
              (await db.query(`SELECT id FROM ${table}`)).rows,
              [{ id: alice }],
              table,
            );
          }
        }),
    );
    for (const table of [
      "custom_apps",
      "custom_keymaps",
      "custom_sections",
      "custom_shortcuts",
    ]) {
      for (const statement of [
        `INSERT INTO ${table} SELECT * FROM ${table} WHERE false`,
        `UPDATE ${table} SET id = id`,
        `DELETE FROM ${table}`,
      ]) {
        await t.test(`denies ${statement}`, () =>
          asUser("anon", claims, () => denied(statement)),
        );
      }
    }
    await t.test("denies profile updates", () =>
      asUser("anon", claims, () =>
        denied("UPDATE profiles SET display_name = 'changed'"),
      ),
    );
    await t.test("denies favorite updates", () =>
      asUser("anon", claims, () =>
        denied("UPDATE favorites SET app_slug = 'changed'"),
      ),
    );
    for (const statement of [
      "SELECT * FROM user_preferences",
      "UPDATE user_preferences SET column_count = 2",
      "DELETE FROM user_preferences",
      "INSERT INTO user_preferences DEFAULT VALUES",
    ]) {
      await t.test(`denies ${statement}`, () =>
        asUser("anon", claims, () => denied(statement)),
      );
    }
    await t.test("creates own profile lazily", () =>
      asUser("anon", { ...claims, sub: "new-user" }, async () => {
        assert.equal(
          (
            await db.query(
              "INSERT INTO profiles(clerk_user_id) VALUES ('new-user') RETURNING clerk_user_id",
            )
          ).rows[0].clerk_user_id,
          "new-user",
        );
      }),
    );
    await t.test("cannot create someone else's profile", () =>
      asUser("anon", claims, () =>
        denied("INSERT INTO profiles(clerk_user_id) VALUES ('someone-else')"),
      ),
    );
    await t.test("adds and removes own favorites", () =>
      asUser("anon", claims, async () => {
        assert.equal(
          (
            await db.query(
              `INSERT INTO favorites(user_id, item_type, app_slug) VALUES ('${alice}', 'app', 'safari') RETURNING id`,
            )
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              `DELETE FROM favorites WHERE id = '${alice}' RETURNING id`,
            )
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              `INSERT INTO favorites(user_id, item_type, custom_app_id) VALUES ('${alice}', 'app', '${alice}') RETURNING id`,
            )
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              `DELETE FROM favorites WHERE id = '${bob}' RETURNING id`,
            )
          ).rows.length,
          0,
        );
      }),
    );
    await t.test("rejects favorites belonging to another user", () =>
      asUser("anon", claims, () =>
        denied(
          `INSERT INTO favorites(user_id, item_type, app_slug) VALUES ('${bob}', 'app', 'safari')`,
        ),
      ),
    );
    await t.test("rejects favorites referencing another user's app", () =>
      asUser("anon", claims, () =>
        denied(
          `INSERT INTO favorites(user_id, item_type, custom_app_id) VALUES ('${alice}', 'app', '${bob}')`,
        ),
      ),
    );
    for (const invalidClaims of [
      {},
      { sub: "alice" },
      { ...claims, iss: "https://wrong.example" },
      { iss: claims.iss },
    ]) {
      await t.test(
        `rejects untrusted/missing identity ${JSON.stringify(invalidClaims)}`,
        () =>
          asUser("anon", invalidClaims, async () => {
            for (const table of tables)
              assert.equal(
                (await db.query(`SELECT * FROM ${table}`)).rows.length,
                0,
                table,
              );
          }),
      );
    }
    await t.test("preserves website write permissions and ownership", () =>
      asUser("authenticated", { sub: "alice" }, async () => {
        assert.equal(
          (
            await db.query(
              "UPDATE profiles SET display_name = 'website' RETURNING id",
            )
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query(
              "UPDATE user_preferences SET column_count = 2 RETURNING user_id",
            )
          ).rows.length,
          1,
        );
        for (const table of [
          "custom_apps",
          "custom_keymaps",
          "custom_sections",
          "custom_shortcuts",
        ]) {
          assert.deepEqual(
            (await db.query(`UPDATE ${table} SET id = id RETURNING id`)).rows,
            [{ id: alice }],
          );
        }
      }),
    );
  });
}
