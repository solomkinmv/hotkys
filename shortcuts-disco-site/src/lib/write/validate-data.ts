import { rootFolder } from "../utils";
import { validateCatalog } from "../load/catalog-validation";
const { apps } = validateCatalog(rootFolder);
console.log(`Validated ${apps.length} applications.`);
