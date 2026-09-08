import { serializeKeymap } from "@/lib/model/keymap-utils";
import type { CustomApp, Favorite, UserCustomizations } from "@/lib/model/user/user-models";
export function customAppHref(slug: string): string { return `/my-shortcuts?app=${encodeURIComponent(slug)}`; }
export interface PublicFavoriteApp { slug: string; keymapTitles: string[] }
export function favoriteHref(favorite: Favorite, customizations: UserCustomizations, publicApps: PublicFavoriteApp[]): string | null {
  if (favorite.customAppId || favorite.appSlug?.startsWith("custom-")) {
    const app = customizations.customApps.find(app => favorite.customAppId ? app.id === favorite.customAppId : `custom-${app.slug}` === favorite.appSlug);
    return app ? customAppHref(app.slug) : null;
  }
  if (favorite.customShortcutId || favorite.customKeymapId) {
    const keymap = [...customizations.customKeymaps, ...customizations.customApps.flatMap(app => app.keymaps)].find(keymap => favorite.customKeymapId ? keymap.id === favorite.customKeymapId : keymap.sections.some(section => section.shortcuts.some(shortcut => shortcut.id === favorite.customShortcutId)));
    if (!keymap) return null;
    if (keymap.customAppId) {
      const app = customizations.customApps.find(app => app.id === keymap.customAppId);
      return app ? customAppHref(app.slug) : null;
    }
    if (keymap.baseAppSlug && publicApps.some(app => app.slug === keymap.baseAppSlug)) return `/apps/${encodeURIComponent(keymap.baseAppSlug)}`;
  }
  const publicApp = publicApps.find(app => app.slug === favorite.appSlug);
  if (!favorite.appSlug || !publicApp) return null;
  if (!favorite.keymapTitle) return `/apps/${encodeURIComponent(favorite.appSlug)}`;
  if (!publicApp.keymapTitles.includes(favorite.keymapTitle)) return null;
  const keymap = serializeKeymap({ title: favorite.keymapTitle, sections: [] });
  if (!keymap) return null;
  return `/apps/${encodeURIComponent(favorite.appSlug)}/${keymap}${favorite.sectionTitle ? `#${encodeURIComponent(favorite.sectionTitle)}` : ""}`;
}
export function favoriteLabel(favorite: Favorite, customApps: CustomApp[]): string {
  const app = customApps.find(app => app.id === favorite.customAppId);
  const keymap = app?.keymaps.find(keymap => keymap.id === favorite.customKeymapId || keymap.sections.some(section => section.shortcuts.some(shortcut => shortcut.id === favorite.customShortcutId)));
  const shortcut = keymap?.sections.flatMap(section => section.shortcuts).find(shortcut => shortcut.id === favorite.customShortcutId);
  return [shortcut?.title ?? favorite.shortcutTitle, keymap?.title ?? favorite.keymapTitle, app?.name ?? favorite.appSlug].filter(Boolean).join(" / ") || "Unavailable favorite";
}
