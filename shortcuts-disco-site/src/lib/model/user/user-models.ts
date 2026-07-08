import type { Platform } from "../internal/internal-models";

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
  createdAt: string;
}

export interface UserPreferences {
  platformFilter: Platform | null;
  viewMode: "list" | "cheatsheet";
  columnCount: number;
}

export interface CustomApp {
  id: string;
  userId: string;
  slug: string;
  name: string;
  bundleId?: string;
  hostname?: string;
  source?: string;
  icon?: string;
  keymaps: CustomKeymap[];
}

export interface CustomKeymap {
  id: string;
  customAppId?: string;
  baseAppSlug?: string;
  title: string;
  platforms?: Platform[];
  sections: CustomSection[];
}

export interface CustomSection {
  id: string;
  keymapId: string;
  title: string;
  sortOrder: number;
  shortcuts: CustomShortcut[];
}

export interface CustomShortcut {
  id: string;
  sectionId?: string;
  baseAppSlug?: string;
  baseKeymapTitle?: string;
  baseSectionTitle?: string;
  baseShortcutTitle?: string;
  title: string;
  key?: string;
  comment?: string;
  isDeleted: boolean;
  sortOrder: number;
}

export interface Favorite {
  id: string;
  userId: string;
  itemType: "app" | "keymap" | "shortcut";
  appSlug?: string;
  keymapTitle?: string;
  shortcutTitle?: string;
  sectionTitle?: string;
  customAppId?: string;
}

export interface ShortcutOverlay {
  baseKey: string;
  modification: Partial<CustomShortcut>;
}

export interface UserCustomizations {
  customApps: CustomApp[];
  shortcuts: ShortcutOverlay[];
  favorites: Favorite[];
}
