import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const schema = readFileSync(new URL("../schema.sql", import.meta.url), "utf8").replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "");
const migration = readFileSync(new URL("../migrations/20261003025605_private_app_editing.sql", import.meta.url), "utf8");
const hosted = readFileSync(new URL("./fixtures/hosted-authoring.sql", import.meta.url), "utf8");
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const [alice, bob, app, otherApp, bobApp, km, km2, publicKm, bobKm, sec, sec2, otherSec, publicSec, shortcut, shortcut2, publicShortcut] = Array.from({ length: 16 }, (_, i) => id(i + 1));

for (const mode of ["schema", "migration", "hosted migration"]) {
  test(`private editing and favorites (${mode})`, async (t) => {
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
    if (mode !== "schema") {
      const old = schema.split("-- Private app editing and stable favorites.")[0]
        .replace(/^.*custom_keymap_id UUID.*\n/gm, "")
        .replace(/^.*custom_shortcut_id UUID.*\n/gm, "")
        .replace(" WHERE custom_keymap_id IS NULL AND custom_shortcut_id IS NULL;", ";");
      await db.exec(old);
      if (mode === "hosted migration") await db.exec(hosted);
      else await db.exec(migration);
    } else {
      await db.exec(schema);
      await db.exec(schema);
    }
    await db.query("INSERT INTO profiles(id,clerk_user_id) VALUES ($1,'alice'),($2,'bob')", [alice, bob]);
    await db.query("INSERT INTO custom_apps(id,user_id,slug,name) VALUES ($1,$2,'one','One'),($3,$2,'two','Two'),($4,$5,'bob','Bob')", [app, alice, otherApp, bobApp, bob]);
    await db.query("INSERT INTO custom_keymaps(id,user_id,custom_app_id,base_app_slug,title) VALUES ($1,$2,$3,NULL,'Same'),($4,$2,$3,NULL,'Second'),($5,$2,NULL,'safari','Default'),($6,$7,$8,NULL,'Same')", [km, alice, app, km2, publicKm, bobKm, bob, bobApp]);
    const otherKm = id(20);
    await db.query("INSERT INTO custom_keymaps(id,user_id,custom_app_id,title) VALUES ($1,$2,$3,'Other')", [otherKm, alice, otherApp]);
    await db.query("INSERT INTO custom_sections(id,keymap_id,title) VALUES ($1,$2,'Same'),($3,$4,'Same'),($5,$6,'Other'),($7,$8,'Public')", [sec, km, sec2, km2, otherSec, otherKm, publicSec, publicKm]);
    await db.query("INSERT INTO custom_shortcuts(id,user_id,section_id,title,key,sort_order) VALUES ($1,$2,$3,'Copy','cmd+c',0),($4,$2,$3,'Copy','cmd+x',1),($5,$2,$6,'Copy','cmd+c',0)", [shortcut, alice, sec, shortcut2, publicShortcut, publicSec]);
    await db.query("INSERT INTO favorites(user_id,item_type,custom_app_id) VALUES ($1,'app',$2)", [alice, app]);
    await db.query("INSERT INTO favorites(user_id,item_type,custom_keymap_id) VALUES ($1,'keymap',$2),($1,'keymap',$3)", [alice, km, km2]);
    await db.query("INSERT INTO favorites(user_id,item_type,custom_shortcut_id) VALUES ($1,'shortcut',$2),($1,'shortcut',$3)", [alice, shortcut, shortcut2]);

    if (mode === "hosted migration") {
      // Existing favorites must survive the upgrade, including two shortcut
      // favorites sharing an ancestor and a favorite for that same keymap.
      await db.query("INSERT INTO custom_shortcuts(id,user_id,section_id,title,key) VALUES ($1,$2,$3,'Paste','cmd+v')", [id(17),alice,publicSec]);
      await db.query("INSERT INTO favorites(user_id,item_type,custom_keymap_id) VALUES ($1,'keymap',$2)", [alice,publicKm]);
      await db.query("INSERT INTO favorites(user_id,item_type,custom_keymap_id,custom_shortcut_id) VALUES ($1,'shortcut',$2,$3),($1,'shortcut',$2,$4)", [alice,publicKm,publicShortcut,id(17)]);
      const before = (await db.query("SELECT * FROM favorites WHERE custom_keymap_id=$1 ORDER BY id", [publicKm])).rows;
      await db.exec(migration);
      await db.exec(migration);
      assert.deepEqual((await db.query("SELECT * FROM favorites WHERE custom_keymap_id=$1 ORDER BY id", [publicKm])).rows, before);
      await db.query("DELETE FROM favorites WHERE custom_keymap_id=$1", [publicKm]);
      await db.query("DELETE FROM custom_shortcuts WHERE id=$1", [id(17)]);
    }

    async function asUser(role, run) {
      await db.exec("BEGIN");
      try {
        await db.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: "alice", iss: "https://clerk.hotkys.com" })]);
        await db.exec(`SET LOCAL ROLE ${role}`);
        await run();
      } finally { await db.exec("ROLLBACK"); }
    }
    const mutate = (entity, target, operation, values = {}, appId = app) => db.query("SELECT private_app_mutate($1,$2,$3,$4,$5)", [appId, entity, target, operation, JSON.stringify(values)]);
    const reorder = (entity, parent, ids) => db.query("SELECT private_app_reorder($1,$2,$3,$4)", [app, entity, parent, ids]);
    const denied = (run) => assert.rejects(run, { code: "42501" });

    await t.test("renames and moves the same shortcut while favorites survive", () => asUser("authenticated", async () => {
      await mutate("keymap", km, "update", { title: "Renamed" });
      await mutate("section", sec, "update", { title: "Renamed" });
      await mutate("shortcut", shortcut, "update", { title: "Paste", key: "cmd+v", section_id: sec2 });
      assert.deepEqual((await db.query("SELECT id,title,section_id,sort_order FROM custom_shortcuts WHERE id=$1", [shortcut])).rows, [{ id: shortcut, title: "Paste", section_id: sec2, sort_order: 0 }]);
      assert.equal((await db.query("SELECT sort_order FROM custom_shortcuts WHERE id=$1", [shortcut2])).rows[0].sort_order, 0);
      assert.equal((await db.query("SELECT * FROM favorites WHERE custom_shortcut_id=$1", [shortcut])).rows.length, 1);
    }));
    await t.test("move clears older ancestor snapshots before source deletion", () => asUser("authenticated", async () => {
      await db.query("UPDATE favorites SET custom_app_id=$1,custom_keymap_id=$2 WHERE custom_shortcut_id=$3", [app,km,shortcut]);
      await mutate("shortcut", shortcut, "update", { title: "Moved", key: "cmd+c", section_id: sec2 });
      await mutate("keymap", km, "delete");
      assert.deepEqual((await db.query("SELECT custom_app_id,custom_keymap_id FROM favorites WHERE custom_shortcut_id=$1", [shortcut])).rows, [{ custom_app_id: null, custom_keymap_id: null }]);
    }));
    for (const [entity, parent, ids] of [["keymap", app, [km2, km]], ["section", km, [sec]], ["shortcut", sec, [shortcut2, shortcut]]]) {
      await t.test(`reorders ${entity} by IDs`, () => asUser("authenticated", async () => {
        await reorder(entity, parent, ids);
        const table = { keymap: "custom_keymaps", section: "custom_sections", shortcut: "custom_shortcuts" }[entity];
        assert.deepEqual((await db.query(`SELECT id FROM ${table} WHERE id=ANY($1) ORDER BY sort_order`, [ids])).rows.map(r => r.id), ids);
      }));
    }
    for (const bad of [[shortcut], [shortcut, shortcut], [shortcut, publicShortcut], [shortcut, null]]) {
      await t.test(`rejects invalid sibling order ${JSON.stringify(bad)}`, () => asUser("authenticated", async () => {
        await db.exec("SAVEPOINT before_order");
        await assert.rejects(() => reorder("shortcut", sec, bad), { code: "22023" });
        await db.exec("ROLLBACK TO before_order");
        assert.deepEqual((await db.query("SELECT sort_order FROM custom_shortcuts WHERE section_id=$1 ORDER BY id", [sec])).rows.map(r => r.sort_order), [0, 1]);
      }));
    }
    for (const [name, run] of [
      ["public source", () => mutate("shortcut", publicShortcut, "delete")],
      ["public keymap", () => mutate("keymap", publicKm, "delete")],
      ["public destination", () => mutate("shortcut", shortcut, "update", { title: "Copy", key: "cmd+c", section_id: publicSec })],
      ["other app destination", () => mutate("shortcut", shortcut, "update", { title: "Copy", key: "cmd+c", section_id: otherSec })],
      ["foreign owner", () => mutate("keymap", bobKm, "delete", {}, bobApp)],
      ["missing target", () => mutate("shortcut", id(999), "delete")],
    ]) await t.test(`rejects ${name}`, () => asUser("authenticated", () => denied(run)));

    for (const role of ["authenticated", "anon"]) {
      for (const [column, target, type] of [["custom_keymap_id", bobKm, "keymap"]]) {
        await t.test(`${role} rejects favorite owned by another user ${target}`, () => asUser(role, () => denied(() => db.query(`INSERT INTO favorites(user_id,item_type,${column}) VALUES ($1,$2,$3)`, [alice, type, target]))));
      }
      await t.test(`${role} retains generic public custom favorites and ancestor snapshots`, () => asUser(role, async () => {
        await db.query("INSERT INTO favorites(user_id,item_type,custom_keymap_id) VALUES ($1,'keymap',$2)", [alice, publicKm]);
        await db.query("INSERT INTO favorites(user_id,item_type,custom_keymap_id,custom_shortcut_id) VALUES ($1,'shortcut',$2,$3)", [alice, publicKm, publicShortcut]);
        assert.equal((await db.query("SELECT * FROM favorites WHERE custom_keymap_id=$1", [publicKm])).rows.length, 2);
        assert.equal((await db.query("DELETE FROM favorites WHERE custom_shortcut_id=$1 RETURNING id", [publicShortcut])).rows.length, 1);
      }));
      await t.test(`${role} rejects mismatched owned ancestor snapshots`, () => asUser(role, () => denied(() => db.query(
        "INSERT INTO favorites(user_id,item_type,custom_keymap_id,custom_shortcut_id) VALUES ($1,'shortcut',$2,$3)", [alice, km, publicShortcut]
      ))));
      await t.test(`${role} keeps stable uniqueness despite label changes`, () => asUser(role, () => assert.rejects(() => db.query("INSERT INTO favorites(user_id,item_type,custom_shortcut_id,shortcut_title) VALUES ($1,'shortcut',$2,'Renamed')", [alice, shortcut]), { code: "23505" })));
      await t.test(`${role} can read and remove private child favorites`, () => asUser(role, async () => {
        assert.equal((await db.query("DELETE FROM favorites WHERE custom_keymap_id=$1 RETURNING id", [km])).rows.length, 1);
        assert.equal((await db.query("INSERT INTO favorites(user_id,item_type,custom_keymap_id) VALUES ($1,'keymap',$2) RETURNING id", [alice, km])).rows.length, 1);
      }));
    }
    await t.test("OAuth cannot execute website mutations or reorder", () => asUser("anon", () => denied(() => mutate("keymap", km, "delete"))));
    await t.test("OAuth cannot execute reorder", () => asUser("anon", () => denied(() => reorder("keymap", app, [km2, km]))));
    for (const [entity, target, remaining] of [["shortcut", shortcut, 4], ["section", sec, 3], ["keymap", km, 2]]) {
      await t.test(`${entity} deletion cascades favorite targets`, () => asUser("authenticated", async () => {
        await mutate(entity, target, "delete");
        assert.equal((await db.query("SELECT * FROM favorites")).rows.length, remaining);
      }));
    }
    await t.test("app deletion cascades all descendants and their favorites", () => asUser("authenticated", async () => {
      await db.query("DELETE FROM custom_apps WHERE id=$1", [app]);
      assert.equal((await db.query("SELECT * FROM favorites")).rows.length, 0);
    }));
  });
}

test("legacy favorites backfill only unique targets and safely rerun", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid);
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  `);
  const old = schema.split("-- Private app editing and stable favorites.")[0]
    .replace(/^.*custom_keymap_id UUID.*\n/gm, "")
    .replace(/^.*custom_shortcut_id UUID.*\n/gm, "")
    .replace(" WHERE custom_keymap_id IS NULL AND custom_shortcut_id IS NULL;", ";");
  await db.exec(old);
  await db.query("INSERT INTO profiles(id,clerk_user_id) VALUES ($1,'alice')", [alice]);
  await db.query("INSERT INTO custom_apps(id,user_id,slug,name) VALUES ($1,$2,'one','One'),($3,$2,'two','Two')", [app,alice,otherApp]);
  await db.query("INSERT INTO custom_keymaps(id,user_id,custom_app_id,title) VALUES ($1,$2,$3,'Keys'),($4,$2,$5,'Keys'),($6,$2,$3,'Duplicate'),($7,$2,$3,'Duplicate')", [km,alice,app,km2,otherApp,id(90),id(91)]);
  await db.query("INSERT INTO custom_sections(id,keymap_id,title) VALUES ($1,$2,'Section')", [sec,km]);
  await db.query("INSERT INTO custom_shortcuts(id,user_id,section_id,title,key) VALUES ($1,$2,$3,'Copy','cmd+c')", [shortcut,alice,sec]);
  await db.query("INSERT INTO favorites(user_id,item_type,custom_app_id,keymap_title) VALUES ($1,'keymap',$2,'Keys'),($1,'keymap',$3,'Keys'),($1,'keymap',$2,'Duplicate')", [alice,app,otherApp]);
  await db.query("INSERT INTO favorites(user_id,item_type,custom_app_id,keymap_title,section_title,shortcut_title) VALUES ($1,'shortcut',$2,'Keys','Section','Copy')", [alice,app]);
  await db.query("INSERT INTO favorites(user_id,item_type,app_slug) VALUES ($1,'app','custom-one')", [alice]);
  await db.exec(migration);
  assert.equal((await db.query("SELECT custom_app_id FROM favorites WHERE item_type='app'")).rows[0].custom_app_id, app);
  assert.deepEqual((await db.query("SELECT custom_keymap_id FROM favorites WHERE custom_keymap_id IS NOT NULL ORDER BY custom_keymap_id")).rows.map(r=>r.custom_keymap_id),[km,km2]);
  assert.equal((await db.query("SELECT custom_shortcut_id FROM favorites WHERE item_type='shortcut'")).rows[0].custom_shortcut_id,shortcut);
  assert.equal((await db.query("SELECT custom_app_id FROM favorites WHERE keymap_title='Duplicate'")).rows[0].custom_app_id,app);
  // An older client can still write a name-based duplicate after deployment.
  await db.query("INSERT INTO favorites(user_id,item_type,custom_app_id,keymap_title) VALUES ($1,'keymap',$2,'Keys')", [alice,app]);
  await db.exec(migration);
  assert.equal((await db.query("SELECT * FROM favorites WHERE custom_keymap_id=$1", [km])).rows.length,1);
  assert.equal((await db.query("SELECT * FROM favorites")).rows.length,5);
});
