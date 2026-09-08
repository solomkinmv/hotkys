import fs from "node:fs";
import path from "node:path";
import type { InputApp } from "../model/input/input-models";
import { validateCatalog } from "../load/catalog-validation";
import { supportsPlatform } from "../shortcut-core/platforms";
export function catalogOutputs(apps: InputApp[], schema: object): Record<string, string> {
  const sorted = [...apps].sort((a,b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  const clean = sorted.map(({ $schema: _schema, ...app }) => app);
  const outputs: Record<string, string> = { "data/combined-apps.json": JSON.stringify({ list: clean }), "schema/shortcut.schema.json": JSON.stringify(schema, null, 2) + "\n" };
  for (const platform of ["macos", "windows", "linux"] as const) {
    const filtered = clean.map(app => ({ ...app, keymaps: app.keymaps.filter(keymap => supportsPlatform(keymap.platforms, platform)) })).filter(app => app.keymaps.length);
    outputs[`data/${platform}/apps.json`] = JSON.stringify({ platform, apps: filtered.map(({ keymaps, ...app }) => ({ ...app, keymaps: keymaps.map(keymap => keymap.title) })) }, null, 2) + "\n";
    for (const app of filtered) outputs[`data/${platform}/${app.slug}.json`] = JSON.stringify(app, null, 2) + "\n";
  }
  return outputs;
}
const owned = ["data/macos", "data/windows", "data/linux", "data/combined-apps.json", "schema/shortcut.schema.json"];
export function publishCatalog(root: string, outputs: Record<string, string>, rename = fs.renameSync): void {
  const publicDir = path.join(root, "public");
  const stage = fs.mkdtempSync(path.join(publicDir, ".hotkys-generation-"));
  const backup = path.join(stage, "backup");
  const installed: string[] = [];
  const backedUp: string[] = [];
  try {
    for (const [name, data] of Object.entries(outputs)) {
      if (!owned.some(owned => name === owned || name.startsWith(owned + "/")) || name.split("/").includes("..")) throw new Error(`Unmanaged catalog output: ${name}`);
      const target = path.join(stage, "next", name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data);
    }
    for (const name of owned) {
      const target = path.join(publicDir, name); fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) { const previous = path.join(backup, name); fs.mkdirSync(path.dirname(previous), { recursive: true }); rename(target, previous); backedUp.push(name); }
      rename(path.join(stage, "next", name), target); installed.push(name);
    }
  } catch (error) {
    for (const name of installed.reverse()) fs.rmSync(path.join(publicDir, name), { recursive: true, force: true });
    for (const name of backedUp.reverse()) fs.renameSync(path.join(backup, name), path.join(publicDir, name));
    throw error;
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
}
export function generateCatalog(root: string): void { const { apps, schema } = validateCatalog(root); publishCatalog(root, catalogOutputs(apps, schema)); }
