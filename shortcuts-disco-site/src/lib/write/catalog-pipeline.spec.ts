/** @jest-environment node */
import { it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { catalogOutputs, generateCatalog, publishCatalog } from "./catalog-pipeline";
import { validateCatalog } from "../load/catalog-validation";
import type { InputApp } from "../model/input/input-models";
let root: string;
let app: InputApp;
const save = () => fs.writeFileSync(path.join(root, `shortcuts-data/${app.slug}.json`), JSON.stringify(app));
const read = (file: string) => fs.readFileSync(path.join(root, "public", file), "utf8");
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "hotkys-catalog-"));
  fs.mkdirSync(path.join(root, "shortcuts-data/schema"), { recursive: true });
  fs.mkdirSync(path.join(root, "public/data"), { recursive: true });
  fs.copyFileSync(path.join(process.cwd(), "shortcuts-data/schema/shortcut.schema.json"), path.join(root, "shortcuts-data/schema/shortcut.schema.json"));
  fs.copyFileSync(path.join(process.cwd(), "public/data/key-codes.json"), path.join(root, "public/data/key-codes.json"));
  app = { $schema: "https://hotkys.com/schema/shortcut.schema.json", name: "Example", slug: "example", keymaps: [{ title: "Default", platforms: ["macos"], sections: [{ title: "General", shortcuts: [{ title: "Copy", key: "cmd+c" }] }] }] };
  save();
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
it("publishes deterministic snapshots, reconciles platform changes/renames/deletes, and preserves key codes and sources", () => {
  const source = fs.readFileSync(path.join(root, "shortcuts-data/example.json"), "utf8");
  const codes = read("data/key-codes.json");
  generateCatalog(root); const first = read("data/combined-apps.json"); generateCatalog(root);
  expect(read("data/combined-apps.json")).toBe(first);
  expect(fs.readFileSync(path.join(root, "shortcuts-data/example.json"), "utf8")).toBe(source);
  fs.unlinkSync(path.join(root, "shortcuts-data/example.json")); app.slug = "renamed"; app.keymaps[0].platforms = ["windows"]; save(); generateCatalog(root);
  expect(fs.existsSync(path.join(root, "public/data/macos/example.json"))).toBe(false);
  expect(JSON.parse(read("data/windows/apps.json")).apps[0].slug).toBe("renamed");
  fs.unlinkSync(path.join(root, "shortcuts-data/renamed.json")); generateCatalog(root);
  expect(JSON.parse(read("data/windows/apps.json")).apps).toEqual([]);
  expect(read("data/key-codes.json")).toBe(codes);
});
it("preserves the last complete generation after invalid input and failed installation", () => {
  generateCatalog(root); const previous = read("data/combined-apps.json");
  app.keymaps[0].sections[0].shortcuts[0].key = "unknown+c"; save();
  expect(() => generateCatalog(root)).toThrow(); expect(read("data/combined-apps.json")).toBe(previous);
  app.keymaps[0].sections[0].shortcuts[0].key = "cmd+v"; save();
  const { apps, schema } = validateCatalog(root); let count = 0;
  expect(() => publishCatalog(root, catalogOutputs(apps, schema), ((from, to) => { if (++count === 4) throw new Error("Disk unavailable"); fs.renameSync(from, to); }) as typeof fs.renameSync)).toThrow("Disk unavailable");
  expect(read("data/combined-apps.json")).toBe(previous);
  expect(JSON.parse(read("data/macos/example.json")).keymaps[0].sections[0].shortcuts[0].key).toBe("cmd+c");
});
it("rejects reserved routes, keymap URL collisions, and escaping icon symlinks", () => {
  app.slug = "apps"; save(); expect(() => validateCatalog(root)).toThrow("reserved slug"); fs.unlinkSync(path.join(root, "shortcuts-data/apps.json"));
  app.slug = "example"; app.keymaps.push({ ...app.keymaps[0], title: "Default!" }); save(); expect(() => validateCatalog(root)).toThrow("duplicated URL");
  app.keymaps.pop(); app.icon = "outside.json"; fs.symlinkSync(path.join(root, "shortcuts-data/schema/shortcut.schema.json"), path.join(root, "public/outside.json")); save();
  expect(() => validateCatalog(root)).toThrow("inside public");
});
it("revalidates key-code and schema changes before publication", () => {
  generateCatalog(root); const previous = read("data/combined-apps.json");
  fs.writeFileSync(path.join(root, "public/data/key-codes.json"), "{}");
  expect(() => generateCatalog(root)).toThrow(); expect(read("data/combined-apps.json")).toBe(previous);
});
