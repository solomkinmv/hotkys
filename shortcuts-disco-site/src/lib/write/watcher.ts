import chokidar from "chokidar";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rootFolder } from "../utils";
import { generateCatalog } from "./catalog-pipeline";
export function watchCatalog(root = rootFolder) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const watcher = chokidar.watch([path.join(root, "shortcuts-data"), path.join(root, "public/data/key-codes.json")], { ignoreInitial: true, usePolling: true, interval: 300 });
  const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { try { generateCatalog(root); console.log("Catalog regenerated."); } catch (error) { console.error(error instanceof Error ? error.message : error); } }, 100); };
  watcher.on("add", refresh).on("change", refresh).on("unlink", refresh);
  const ready = new Promise<void>(resolve => watcher.once("ready", () => resolve()));
  return { ready, async close() { clearTimeout(timer); await watcher.close(); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateCatalog(rootFolder);
  const watcher = watchCatalog();
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => { void watcher.close().then(() => process.exit(0)); });
}
