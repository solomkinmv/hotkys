import { AppShortcuts, Platform } from "@/lib/model/internal/internal-models";

/**
 * Get unique platforms supported by an application
 * @param app - Application shortcuts object
 * @returns Array of unique platforms, or empty array if no platforms specified
 */
export function getAppPlatforms(app: AppShortcuts): Platform[] {
  const platforms = app.keymaps
    .map((k) => k.platform)
    .filter((p): p is Platform => p !== undefined);
  return Array.from(new Set(platforms));
}

/**
 * Get platform icon/symbol
 * @param platform - Platform identifier
 * @returns Icon character for the platform
 */
export function getPlatformIcon(platform: Platform): string {
  switch (platform) {
    case "windows":
      return "⊞";
    case "linux":
      return "🐧";
    case "macos":
      return "⌘";
  }
}

/**
 * Check if an app matches the platform filter
 * @param app - Application shortcuts object
 * @param platformFilter - Platform to filter by (null = all platforms)
 * @returns True if app has at least one keymap matching the filter
 */
export function appMatchesPlatformFilter(
  app: AppShortcuts,
  platformFilter: Platform | null
): boolean {
  // If filter is null (All), show all apps
  if (platformFilter === null) return true;

  const appPlatforms = getAppPlatforms(app);

  // If no platforms specified in app data, always show it
  if (appPlatforms.length === 0) return true;

  // Check if app has a keymap for the selected platform
  return appPlatforms.includes(platformFilter);
}
