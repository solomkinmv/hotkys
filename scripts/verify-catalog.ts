import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { exportService } from "../shortcuts-disco-site/src/lib/services/export-service";
import { generateCatalog } from "../shortcuts-disco-site/src/lib/write/catalog-pipeline";
import { watchCatalog } from "../shortcuts-disco-site/src/lib/write/watcher";
import { ShortcutsParser as WebsiteParser } from "../shortcuts-disco-site/src/lib/load/input-parser";
import { ShortcutsParser as RaycastParser } from "../shortcuts-raycast-extension/src/load/input-parser";
import { getBaseShortcutId } from "../shortcuts-disco-site/src/lib/shortcut-core/identity";
import type { CustomApp } from "../shortcuts-disco-site/src/lib/model/user/user-models";
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hotkys-roundtrip-"));
  let watcher: ReturnType<typeof watchCatalog> | undefined;
  const source = path.join(root, "shortcuts-data");
  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(root, "public", file), "utf8"));
  const save = (slug: string, value: unknown) => fs.writeFileSync(path.join(source, `${slug}.json`), JSON.stringify(value));
  async function until(condition: () => boolean) { const deadline = Date.now() + 10000; while (!condition()) { if (Date.now() > deadline) throw new Error("Watcher did not publish the expected snapshot"); await pause(50); } }
  try {
    fs.mkdirSync(path.join(source, "schema"), { recursive: true }); fs.mkdirSync(path.join(root, "public/data"), { recursive: true });
    fs.copyFileSync("shortcuts-data/schema/shortcut.schema.json", path.join(source, "schema/shortcut.schema.json"));
    fs.copyFileSync("public/data/key-codes.json", path.join(root, "public/data/key-codes.json"));
    for (const kind of ["desktop", "web"] as const) {
      const app: CustomApp = { id: "private-app", userId: "private-owner", slug: `example-${kind}`, name: `Example ${kind}`, ...(kind === "desktop" ? { bundleId: "com.example.Fixture" } : { hostname: "example.com" }), source: "https://example.com/shortcuts", keymaps: [{ id: "private-keymap", title: "Default", platforms: ["macos", "linux"], sections: [{ id: "private-section", keymapId: "private-keymap", title: "General", sortOrder: 0, shortcuts: [{ id: "private-shortcut", title: "Zoom", key: "cmd++ cmd+c", isDeleted: false, sortOrder: 0 }] }] }] };
      const exported = exportService.exportCustomApp(app);
      assert.ok(!exported.json.includes("private-")); save(app.slug, exported.app);
    }
    generateCatalog(root);
    const combined = read("data/combined-apps.json").list;
    const website = new WebsiteParser().parseInputShortcuts(combined);
    const raycast = new RaycastParser(Object.fromEntries(read("data/key-codes.json").keyCodes)).parseInputShortcuts([read("data/macos/example-desktop.json"), read("data/macos/example-web.json")]);
    assert.equal(website.length, 2); assert.equal(raycast.length, 2);
    for (let index = 0; index < 2; index++) {
      const webRow = website[index].keymaps[0].sections[0].hotkeys[0]; const rayRow = raycast[index].keymaps[0].sections[0].hotkeys[0];
      assert.deepEqual(webRow.sequence, [{ base: "+", modifiers: ["command down"] }, { base: "c", modifiers: ["command down"] }]);
      assert.deepEqual(rayRow.sequence, webRow.sequence); assert.deepEqual(raycast[index].keymaps[0].platforms, ["macos", "linux"]);
      assert.equal(getBaseShortcutId(webRow, 0), getBaseShortcutId(rayRow, 0));
    }
    watcher = watchCatalog(root); await watcher.ready;
    const added = { ...combined[0], $schema: "https://hotkys.com/schema/shortcut.schema.json", slug: "added", name: "Added", bundleId: "com.example.Added" };
    save("added", added); await until(() => read("data/macos/apps.json").apps.some((app: { slug: string }) => app.slug === "added"));
    added.keymaps[0].platforms = ["windows"]; save("added", added);
    await until(() => !fs.existsSync(path.join(root, "public/data/macos/added.json")) && fs.existsSync(path.join(root, "public/data/windows/added.json")));
    fs.unlinkSync(path.join(source, "added.json")); await until(() => !fs.existsSync(path.join(root, "public/data/windows/added.json")));
    const schema = read("schema/shortcut.schema.json"); schema.title = "Watcher schema test";
    fs.writeFileSync(path.join(source, "schema/shortcut.schema.json"), JSON.stringify(schema)); await until(() => read("schema/shortcut.schema.json").title === schema.title);
    // A key-code update must trigger publication too. A removed generated file
    // is restored by regeneration without touching tracked key-code bytes.
    fs.unlinkSync(path.join(root, "public/data/macos/example-desktop.json"));
    const codes = fs.readFileSync(path.join(root, "public/data/key-codes.json"), "utf8") + "\n";
    fs.writeFileSync(path.join(root, "public/data/key-codes.json"), codes);
    await until(() => fs.existsSync(path.join(root, "public/data/macos/example-desktop.json")));
    assert.equal(fs.readFileSync(path.join(root, "public/data/key-codes.json"), "utf8"), codes);
    console.log("Desktop/web export → catalog → both consumers and real watcher add/change/delete/schema/key-code checks passed.");
  } finally { await watcher?.close(); fs.rmSync(root, { recursive: true, force: true }); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
