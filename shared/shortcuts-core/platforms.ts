import type { Platform } from "./types";
export function supportsPlatform(platforms: readonly string[] | undefined, platform: Platform): boolean {
  return platforms === undefined || platforms.includes(platform);
}
