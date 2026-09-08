// Compare persisted public references; additions alone do not invalidate saved data.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.argv[2];
if (!base || base.startsWith("-")) throw new Error("Usage: node scripts/check-catalog-identities.mjs BASE_REF");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
git("rev-parse", "--verify", `${base}^{commit}`);
const prefix = "shortcuts-disco-site/shortcuts-data/";
const files = git("ls-tree", "-r", "--name-only", base, "--", prefix).split("\n").filter(file => /^shortcuts-disco-site\/shortcuts-data\/[^/]+\.json$/.test(file));
function references(app) {
  return app.keymaps.flatMap(keymap => keymap.sections.flatMap(section => {
    const occurrences = new Map();
    return section.shortcuts.map(shortcut => {
      const signature = JSON.stringify([shortcut.key?.trim().replace(/\s+/g, " ") ?? "", shortcut.title, shortcut.comment ?? ""]);
      const occurrence = occurrences.get(signature) ?? 0; occurrences.set(signature, occurrence + 1);
      return JSON.stringify([app.slug, keymap.title, section.title, signature, occurrence]);
    });
  }));
}
const removed = [];
for (const file of files) {
  const previous = JSON.parse(git("show", `${base}:${file}`));
  let next;
  try { next = JSON.parse(readFileSync(new URL(file, new URL("../", import.meta.url)), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const current = new Set(next ? references(next) : []);
  removed.push(...references(previous).filter(reference => !current.has(reference)));
}
if (removed.length) {
  const fingerprint = createHash("sha256").update(JSON.stringify(removed.sort())).digest("hex");
  const decisions = JSON.parse(readFileSync(new URL("../docs/catalog-compatibility.json", import.meta.url), "utf8"));
  const decision = decisions.find(item => item.fingerprint === fingerprint && typeof item.reason === "string" && item.reason.trim().length >= 30);
  console.log(`${removed.length} existing public references affected. Fingerprint: ${fingerprint}`);
  console.log(removed.join("\n"));
  if (!decision) throw new Error("Record this exact fingerprint and a deliberate compatibility/migration decision in docs/catalog-compatibility.json. Do not guess mappings from labels.");
  console.log(`Recorded decision: ${decision.reason}`);
} else console.log("No existing public shortcut references changed.");
