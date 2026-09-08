import { pathToFileURL } from "node:url";
import { rootFolder } from "../utils";
import { generateCatalog } from "./catalog-pipeline";
export function combineApps() { generateCatalog(rootFolder); }
export function generatePlatformFiles() { generateCatalog(rootFolder); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { generateCatalog(rootFolder); console.log("Validated and generated the complete catalog."); }
