import type { AppShortcuts, Platform } from "./internal-models";

/** Per-keymap data the app list needs without shipping every shortcut. */
export interface KeymapSummary {
  title: string;
  platforms?: Platform[];
  customKeymapId?: string;
  shortcutCount: number;
}

/** Lightweight app entry for lists; full shortcut data is loaded on demand. */
export interface AppSummary {
  slug: string;
  name: string;
  icon?: string;
  customAppId?: string;
  keymaps: KeymapSummary[];
}

// Optional fields are omitted rather than set to undefined to keep the
// serialized server payload small.
export function summarizeApp(app: AppShortcuts): AppSummary {
  return {
    slug: app.slug,
    name: app.name,
    ...(app.icon ? { icon: app.icon } : {}),
    ...(app.customAppId ? { customAppId: app.customAppId } : {}),
    keymaps: app.keymaps.map((keymap) => ({
      title: keymap.title,
      ...(keymap.platforms ? { platforms: keymap.platforms } : {}),
      ...(keymap.customKeymapId
        ? { customKeymapId: keymap.customKeymapId }
        : {}),
      shortcutCount: keymap.sections.reduce(
        (total, section) => total + section.hotkeys.length,
        0,
      ),
    })),
  };
}

export function summarizeApps(apps: AppShortcuts[]): AppSummary[] {
  return apps.map(summarizeApp);
}
