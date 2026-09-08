import { loadEnvConfig } from "@next/env";
import { readPublicAuthConfig, validateAuthConfig, type AuthMode } from "../src/lib/auth/config-validation";
loadEnvConfig(process.cwd());
const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex < 0 ? "auto" : process.argv[modeIndex + 1];
if (!["public", "test", "production", "auto"].includes(mode)) throw new Error("Choose --mode public, test, production, or auto.");
const resolved = validateAuthConfig(readPublicAuthConfig(), mode as AuthMode);
console.log(`Auth configuration: ${resolved} mode passed. No credentials printed.`);
