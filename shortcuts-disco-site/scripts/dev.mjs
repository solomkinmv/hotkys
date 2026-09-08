import { spawn } from "node:child_process";
const children = [spawn(process.execPath, ["--import", "tsx", "src/lib/write/watcher.ts"], { stdio: "inherit" }), spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)], { stdio: "inherit" })];
let stopping = false;
const stop = code => { if (stopping) return; stopping = true; children.forEach(child => child.kill("SIGTERM")); process.exitCode = code; };
children.forEach(child => { child.on("error", () => stop(1)); child.on("exit", code => stop(code ?? 1)); });
process.on("SIGINT", () => stop(0)); process.on("SIGTERM", () => stop(0));
