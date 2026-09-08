import { readFileSync } from "node:fs";
import path from "node:path";
import { rootFolder } from "../utils";
export function loadKeyCodes(file = path.join(rootFolder, "public/data/key-codes.json")): Map<string, string> {
  const input: unknown = JSON.parse(readFileSync(file, "utf8"));
  const rows = (input as { keyCodes?: unknown }).keyCodes;
  if (!Array.isArray(rows) || rows.some(row => !Array.isArray(row) || row.length !== 2 || row.some(value => typeof value !== "string"))) throw new Error(`${file}: invalid key code table`);
  return new Map(rows as [string, string][]);
}
