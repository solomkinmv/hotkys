import type { AppMetadata } from "../model/input/input-models";
import type { Favorite, UserCustomizations } from "./models";

export interface FavoriteListItem {
  id: string;
  title: string;
  subtitle: string;
  appSlug?: string;
  keymapTitle?: string;
  searchText?: string;
}

export function mergeAppMetadata(
  baseApps: AppMetadata[],
  customizations: UserCustomizations | undefined
): AppMetadata[] {
  if (!customizations) return baseApps;

  return [
    ...baseApps,
    ...customizations.customApps.map((app) => ({
      name: app.name,
      slug: `custom-${app.slug}`,
      customAppId: app.id,
      bundleId: app.bundleId,
      hostname: app.hostname,
      source: app.source,
      icon: app.icon,
      keymaps: app.keymaps.map((keymap) => keymap.title),
    })),
  ];
}

export function selectCustomizedApps(apps: AppMetadata[], customizations: UserCustomizations): AppMetadata[] {
  const customizedSlugs = new Set(
    customizations.customKeymaps.flatMap((keymap) => (keymap.baseAppSlug ? [keymap.baseAppSlug] : []))
  );
  for (const overlay of customizations.shortcuts) {
    customizedSlugs.add(overlay.baseKey.split(":", 1)[0]);
  }

  return apps.filter((app) => app.customAppId || customizedSlugs.has(app.slug));
}

export function resolveFavoriteItem(favorite: Favorite, apps: AppMetadata[]): FavoriteListItem {
  const app = apps.find(
    (candidate) =>
      candidate.slug === favorite.appSlug || (favorite.customAppId && candidate.customAppId === favorite.customAppId)
  );
  const appName = app?.name ?? favorite.appSlug ?? "Unknown application";
  const appSlug = app?.slug ?? favorite.appSlug;

  if (favorite.itemType === "shortcut") {
    return {
      id: favorite.id,
      title: favorite.shortcutTitle ?? "Unknown shortcut",
      subtitle: [appName, favorite.keymapTitle, favorite.sectionTitle].filter(Boolean).join(" › "),
      appSlug,
      keymapTitle: favorite.keymapTitle,
      searchText: favorite.shortcutTitle,
    };
  }

  if (favorite.itemType === "keymap") {
    return {
      id: favorite.id,
      title: favorite.keymapTitle ?? "Unknown keymap",
      subtitle: appName,
      appSlug,
      keymapTitle: favorite.keymapTitle,
      searchText: undefined,
    };
  }

  return {
    id: favorite.id,
    title: appName,
    subtitle: "Application",
    appSlug,
    keymapTitle: undefined,
    searchText: undefined,
  };
}
