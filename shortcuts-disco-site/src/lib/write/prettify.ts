import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dataFolder } from "../utils";
import type { InputApp } from "../model/input/input-models";
import { normalizeShortcutKey } from "../shortcut-key-format";
export function prettifyApp(inputApp: InputApp) {
  for (const keymap of inputApp.keymaps) for (const section of keymap.sections) for (const shortcut of section.shortcuts) if (shortcut.key) shortcut.key = normalizeShortcutKey(shortcut.key);
}
export function formatCatalogFiles(names: string[], write: boolean, directory = dataFolder): string[] {
  const changed: string[] = [];
  for (const name of names.sort()) {
    if (path.basename(name) !== name || !name.endsWith(".json")) throw new Error(`Use a source JSON filename: ${name}`);
    const file = path.join(directory, name); const original = fs.readFileSync(file, "utf8"); const app = JSON.parse(original) as InputApp;
    prettifyApp(app);
    const formatted = JSON.stringify(app, null, 2) + "\n";
    if (original !== formatted) { changed.push(name); if (write) fs.writeFileSync(file, formatted); }
  }
  return changed;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2); const write = args.includes("--write");
  if (!write && !args.includes("--check")) throw new Error("Choose --check or --write, optionally followed by source filenames.");
  const selected = args.filter(arg => !arg.startsWith("--"));
  const changed = formatCatalogFiles(selected.length ? selected : fs.readdirSync(dataFolder).filter(name => name.endsWith(".json")), write);
  if (changed.length && !write) { console.error(`Formatting required: ${changed.join(", ")}`); process.exitCode = 1; }
}
