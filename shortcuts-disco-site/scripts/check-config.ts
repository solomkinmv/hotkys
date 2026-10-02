import { loadEnvConfig } from "@next/env";
import { readPublicAuthConfig, validateAuthConfig, type AuthMode } from "../src/lib/auth/config-validation";
import { checkDatabaseSchema } from "./check-database";
loadEnvConfig(process.cwd());
const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex < 0 ? "auto" : process.argv[modeIndex + 1];
if (!["public", "test", "production", "auto"].includes(mode)) throw new Error("Choose --mode public, test, production, or auto.");
const config = readPublicAuthConfig();
const resolved = validateAuthConfig(config, mode as AuthMode);
console.log(`Auth configuration: ${resolved} mode passed. No credentials printed.`);
if (process.argv.includes("--database")) {
  if (resolved === "public") throw new Error("Database checks require configured account mode.");
  checkDatabaseSchema(config).then(() => console.log("Database schema: required columns passed (zero rows read)."))
    .catch(error => { console.error(error instanceof Error ? error.message : "Database schema check failed."); process.exitCode = 1; });
}
