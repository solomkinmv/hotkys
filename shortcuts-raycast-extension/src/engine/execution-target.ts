export type ExecutionTarget =
  | { kind: "desktop"; bundleId: string }
  | { kind: "browser"; bundleId: string; hostname: string; url: string };
export const chromiumBundles = [
  "com.google.Chrome",
  "com.google.Chrome.beta",
  "com.google.Chrome.canary",
  "com.vivaldi.Vivaldi",
  "com.brave.Browser",
  "com.microsoft.edgemac",
  "com.operasoftware.Opera",
  "org.chromium.Chromium",
];
export const safariBundles = ["com.apple.Safari", "com.apple.SafariTechPreview"];
export function validateTarget(target: ExecutionTarget): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9.-]+$/.test(target.bundleId)) throw new Error("Application target is unavailable");
  if (target.kind === "browser") {
    if (![...chromiumBundles, ...safariBundles, "company.thebrowser.Browser"].includes(target.bundleId))
      throw new Error("Browser is unsupported");
    const url = new URL(target.url);
    if (!["https:", "http:"].includes(url.protocol) || url.hostname !== target.hostname)
      throw new Error("Web page target changed");
  }
}
export function parseDelay(value: string | number): number {
  const delay = typeof value === "number" ? value : value.trim() === "" ? 0.1 : Number(value);
  if (!Number.isFinite(delay) || delay < 0 || delay > 5) throw new Error("Delay must be between 0 and 5 seconds");
  return delay;
}
