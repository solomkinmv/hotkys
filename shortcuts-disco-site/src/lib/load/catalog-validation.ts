import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";
import type { InputApp } from "../model/input/input-models";
import { validatePublicRoutes } from "./catalog-rules";
import Validator from "./validator";
import { loadKeyCodes } from "./key-codes";
export function createSchemaValidator(schema: object) {
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
  ajv.addFormat("uri", { type: "string", validate: (value: string) => { try { new URL(value); return true; } catch { return false; } } });
  return ajv.compile<InputApp>(schema);
}
export function validateCatalog(root: string): { apps: InputApp[]; schema: object } {
  const source = path.join(root, "shortcuts-data");
  const schema: object = JSON.parse(fs.readFileSync(path.join(source, "schema/shortcut.schema.json"), "utf8"));
  const check = createSchemaValidator(schema);
  const apps = fs.readdirSync(source).filter(name => name.endsWith(".json")).sort().map(name => {
    let input: unknown;
    try { input = JSON.parse(fs.readFileSync(path.join(source, name), "utf8")); } catch (error) { throw new Error(`${name}: ${error instanceof Error ? error.message : "invalid JSON"}`); }
    if (!check(input)) throw new Error(`${name}: ${check.errors?.map(error => `${error.instancePath || "/"} ${error.message}`).join("; ")}`);
    if (input.slug !== name.slice(0, -5)) throw new Error(`${name}: filename must match slug ${input.slug}`);
    validatePublicRoutes(input);
    if (input.icon && !/^https?:\/\//i.test(input.icon)) {
      const publicDir = path.join(root, "public");
      const icon = path.resolve(publicDir, input.icon.replace(/^\//, ""));
      if (!icon.startsWith(publicDir + path.sep) || !fs.existsSync(icon) || !fs.statSync(icon).isFile() || !fs.realpathSync(icon).startsWith(fs.realpathSync(publicDir) + path.sep)) throw new Error(`${name}: local icon does not exist inside public/: ${input.icon}`);
    }
    return input;
  });
  const slugs = new Set<string>();
  for (const app of apps) { const slug = app.slug.toLowerCase(); if (slugs.has(slug)) throw new Error(`${app.slug}: case-insensitive slug collision`); slugs.add(slug); }
  new Validator(loadKeyCodes(path.join(root, "public/data/key-codes.json"))).validate(apps);
  return { apps, schema };
}
