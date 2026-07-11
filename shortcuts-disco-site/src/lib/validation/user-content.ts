import type { Platform } from "@/lib/model/internal/internal-models";
import {
  isHttpUrl,
  isSafeImageLocation,
} from "@/lib/validation/resource-location";

export const USER_CONTENT_LIMITS = {
  displayName: 100,
  appName: 100,
  slug: 80,
  bundleId: 255,
  hostname: 253,
  urlOrPath: 2048,
  keymapTitle: 100,
  sectionTitle: 100,
  shortcutTitle: 50,
  shortcutKey: 255,
  shortcutComment: 50,
  baseShortcutId: 1024,
  customApps: 25,
  customKeymaps: 100,
  customSections: 500,
  customShortcuts: 2000,
  favorites: 500,
} as const;

export const CUSTOM_APP_SLUG_PATTERN = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/;
const VALID_PLATFORMS = new Set<Platform>(["macos", "windows", "linux"]);

interface CustomAppMetadata {
  name?: string;
  slug?: string;
  bundleId?: string | null;
  hostname?: string | null;
  source?: string | null;
  icon?: string | null;
}

interface CustomKeymapMetadata {
  baseAppSlug?: string;
  title: string;
  platforms?: Platform[];
}

interface CustomSectionMetadata {
  title: string;
  sortOrder: number;
}

interface ShortcutStorageMetadata {
  baseAppSlug?: string;
  baseKeymapTitle?: string;
  baseSectionTitle?: string;
  baseShortcutTitle?: string;
  baseShortcutId?: string;
  sortOrder: number;
}

interface FavoriteMetadata {
  appSlug?: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
  baseShortcutId?: string;
}

export function validateCustomAppMetadata(app: CustomAppMetadata): void {
  if (app.name !== undefined) {
    validateRequiredText(app.name, "App name", USER_CONTENT_LIMITS.appName);
  }
  if (app.slug !== undefined) {
    validateRequiredText(app.slug, "Slug", USER_CONTENT_LIMITS.slug);
    if (!CUSTOM_APP_SLUG_PATTERN.test(app.slug)) {
      throw new Error(
        "Slug must contain only letters, numbers, and single hyphens",
      );
    }
  }
  validateOptionalText(app.bundleId, "Bundle ID", USER_CONTENT_LIMITS.bundleId);
  validateOptionalText(app.hostname, "Hostname", USER_CONTENT_LIMITS.hostname);
  validateOptionalText(app.source, "Source URL", USER_CONTENT_LIMITS.urlOrPath);
  validateOptionalText(app.icon, "Image path", USER_CONTENT_LIMITS.urlOrPath);
  if (app.source && !isHttpUrl(app.source)) {
    throw new Error("Source URL must use http or https");
  }
  if (app.icon && !isSafeImageLocation(app.icon)) {
    throw new Error(
      "Image path must be a relative path or an http/https URL",
    );
  }
}

export function validateCustomKeymapMetadata(keymap: CustomKeymapMetadata): void {
  validateRequiredText(
    keymap.title,
    "Keymap title",
    USER_CONTENT_LIMITS.keymapTitle,
  );
  validateOptionalText(
    keymap.baseAppSlug,
    "Base app slug",
    USER_CONTENT_LIMITS.slug,
  );
  if (keymap.platforms && new Set(keymap.platforms).size !== keymap.platforms.length) {
    throw new Error("Keymap platforms must be unique");
  }
  if (keymap.platforms?.some((platform) => !VALID_PLATFORMS.has(platform))) {
    throw new Error("Unsupported keymap platform");
  }
}

export function validateCustomSectionMetadata(section: CustomSectionMetadata): void {
  validateRequiredText(
    section.title,
    "Section title",
    USER_CONTENT_LIMITS.sectionTitle,
  );
  if (!Number.isInteger(section.sortOrder) || section.sortOrder < 0) {
    throw new Error("Section sort order must be a non-negative integer");
  }
}

export function validateShortcutStorageMetadata(
  shortcut: ShortcutStorageMetadata,
): void {
  validateOptionalText(
    shortcut.baseAppSlug,
    "Base app slug",
    USER_CONTENT_LIMITS.slug,
  );
  validateOptionalText(
    shortcut.baseKeymapTitle,
    "Base keymap title",
    USER_CONTENT_LIMITS.keymapTitle,
  );
  validateOptionalText(
    shortcut.baseSectionTitle,
    "Base section title",
    USER_CONTENT_LIMITS.sectionTitle,
  );
  validateOptionalText(
    shortcut.baseShortcutTitle,
    "Base shortcut title",
    USER_CONTENT_LIMITS.shortcutTitle,
  );
  validateOptionalText(
    shortcut.baseShortcutId,
    "Base shortcut ID",
    USER_CONTENT_LIMITS.baseShortcutId,
  );
  if (!Number.isInteger(shortcut.sortOrder) || shortcut.sortOrder < 0) {
    throw new Error("Shortcut sort order must be a non-negative integer");
  }
}

export function validateFavoriteMetadata(favorite: FavoriteMetadata): void {
  validateOptionalText(favorite.appSlug, "App slug", USER_CONTENT_LIMITS.slug + 7);
  validateOptionalText(
    favorite.keymapTitle,
    "Keymap title",
    USER_CONTENT_LIMITS.keymapTitle,
  );
  validateOptionalText(
    favorite.sectionTitle,
    "Section title",
    USER_CONTENT_LIMITS.sectionTitle,
  );
  validateOptionalText(
    favorite.shortcutTitle,
    "Shortcut title",
    USER_CONTENT_LIMITS.shortcutTitle,
  );
  validateOptionalText(
    favorite.baseShortcutId,
    "Base shortcut ID",
    USER_CONTENT_LIMITS.baseShortcutId,
  );
}

export function validateProfileMetadata(profile: {
  displayName: string | null;
  avatarUrl: string | null;
}): void {
  validateOptionalText(
    profile.displayName,
    "Display name",
    USER_CONTENT_LIMITS.displayName,
  );
  validateOptionalText(
    profile.avatarUrl,
    "Avatar URL",
    USER_CONTENT_LIMITS.urlOrPath,
  );
}

export function validateRequiredText(
  value: string,
  label: string,
  maxLength: number,
): void {
  if (value.trim().length === 0) throw new Error(`${label} is required`);
  validateTextLength(value, label, maxLength);
}

export function assertResourceLimit(
  currentCount: number,
  maxCount: number,
  label: string,
): void {
  if (currentCount >= maxCount) {
    throw new Error(`You can save at most ${maxCount} ${label}.`);
  }
}

export function validateOptionalText(
  value: string | null | undefined,
  label: string,
  maxLength: number,
): void {
  if (value === null || value === undefined || value.length === 0) return;
  validateTextLength(value, label, maxLength);
}

function validateTextLength(value: string, label: string, maxLength: number): void {
  if (value.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }
}
