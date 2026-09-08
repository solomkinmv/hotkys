import type { InputApp } from "../model/input/input-models";
import { serializeKeymap } from "../model/keymap-utils";
const reserved = new Set(["apps", "combined-apps", "key-codes", "schema"]);
// Pure rules are shared by browser export and filesystem catalog ingestion.
export function validatePublicRoutes(app: InputApp): void {
  if (reserved.has(app.slug.toLowerCase()) || app.slug.toLowerCase().startsWith("custom-")) throw new Error(`${app.slug}: reserved slug`);
  const routes = new Set<string>();
  for (const keymap of app.keymaps) {
    const route = serializeKeymap({ title: keymap.title, sections: [] });
    if (!route || routes.has(route)) throw new Error(`${app.slug}: keymap ${keymap.title} has an empty or duplicated URL path`);
    routes.add(route);
  }
}
