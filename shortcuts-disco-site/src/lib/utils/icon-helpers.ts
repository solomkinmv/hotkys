/**
 * Returns the full URL for an app icon.
 *
 * Handles three cases:
 * 1. Absolute URLs (http:// or https://) - returned as-is
 * 2. Relative paths with leading slash - returned as-is
 * 3. Relative paths without leading slash - prepended with '/'
 *
 * @param icon - Icon path or URL (can be undefined)
 * @returns Full icon URL, or undefined if no valid icon provided
 *
 * @example
 * getIconUrl("icons/app.png") // Returns "/icons/app.png"
 * getIconUrl("https://example.com/icon.png") // Returns "https://example.com/icon.png"
 * getIconUrl(undefined) // Returns undefined
 */
export function getIconUrl(icon: string | undefined): string | undefined {
  if (!icon?.trim()) return undefined;

  const trimmedIcon = icon.trim();

  if (/^https?:\/\//i.test(trimmedIcon)) {
    return trimmedIcon;
  }

  return trimmedIcon.startsWith("/") ? trimmedIcon : `/${trimmedIcon}`;
}
