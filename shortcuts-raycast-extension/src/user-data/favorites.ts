import type { Application, SectionShortcut } from "../model/internal/internal-models";
import type { Favorite } from "./models";

export interface FavoriteIdentifier {
  itemType: "app" | "keymap" | "shortcut";
  appSlug?: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
  baseShortcutId?: string;
  customAppId?: string;
}

export function matchesFavorite(favorite: Favorite, identifier: FavoriteIdentifier): boolean {
  if (favorite.itemType !== identifier.itemType) return false;
  if (favorite.appSlug !== identifier.appSlug) return false;
  if (favorite.customAppId !== identifier.customAppId) return false;
  if (identifier.itemType === "app") return true;
  if (favorite.keymapTitle !== identifier.keymapTitle) return false;
  if (identifier.itemType === "keymap") return true;
  if (favorite.sectionTitle !== identifier.sectionTitle) return false;

  if (favorite.baseShortcutId && identifier.baseShortcutId) {
    return favorite.baseShortcutId === identifier.baseShortcutId;
  }

  return favorite.shortcutTitle === identifier.shortcutTitle;
}

export function toShortcutFavoriteIdentifier(
  application: Pick<Application, "slug" | "customAppId">,
  keymapTitle: string,
  sectionTitle: string,
  shortcut: SectionShortcut
): FavoriteIdentifier {
  return {
    itemType: "shortcut",
    appSlug: application.slug,
    customAppId: application.customAppId,
    keymapTitle,
    sectionTitle: shortcut.baseSectionTitle ?? sectionTitle,
    shortcutTitle: shortcut.baseShortcutTitle ?? shortcut.title,
    baseShortcutId: shortcut.baseShortcutId,
  };
}

export function toFavoriteInsert(userId: string, identifier: FavoriteIdentifier): Record<string, string | null> {
  return {
    user_id: userId,
    item_type: identifier.itemType,
    app_slug: identifier.appSlug ?? null,
    keymap_title: identifier.keymapTitle ?? null,
    section_title: identifier.sectionTitle ?? null,
    shortcut_title: identifier.shortcutTitle ?? null,
    base_shortcut_id: identifier.baseShortcutId ?? null,
    custom_app_id: identifier.customAppId ?? null,
  };
}
