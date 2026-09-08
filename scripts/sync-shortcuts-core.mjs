import { readdir, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "shared/shortcuts-core");
const destinations = ["shortcuts-disco-site/src/lib/shortcut-core", "shortcuts-raycast-extension/src/shortcut-core"];
const write = process.argv.includes("--write");
if (!write && !process.argv.includes("--check")) throw new Error("Use --write or --check");
async function files(dir, prefix = "") {
  let result = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(e => { if (e.code === "ENOENT") return []; throw e; })) {
    const name = path.join(prefix, entry.name);
    result.push(...(entry.isDirectory() ? await files(path.join(dir, entry.name), name) : [name]));
  }
  return result.sort();
}
const names = await files(source);
let failures = [];
for (const destination of destinations) {
  const dir = path.join(root, destination);
  for (const name of names) {
    const body = await readFile(path.join(source, name), "utf8");
    const expected = name.endsWith(".ts") ? "// Generated from shared/shortcuts-core; run scripts/sync-shortcuts-core.mjs --write.\n" + body : body;
    const target = path.join(dir, name);
    if (write) { await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, expected); }
    else if (await readFile(target, "utf8").catch(() => null) !== expected) failures.push(`${destination}/${name}`);
  }
  for (const extra of (await files(dir)).filter(name => !names.includes(name))) {
    if (write) await rm(path.join(dir, extra)); else failures.push(`${destination}/${extra} (extra)`);
  }
}
if (failures.length) throw new Error(`Generated core differs:\n${failures.join("\n")}`);
