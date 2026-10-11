import { pathToFileURL } from "node:url";
import { rootFolder } from "../utils";
import { generateCatalog } from "./catalog-pipeline";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { generateCatalog(rootFolder); console.log("Validated and generated the complete catalog."); }
