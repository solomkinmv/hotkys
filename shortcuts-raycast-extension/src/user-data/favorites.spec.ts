import { matchesFavorite, toFavoriteInsert, toShortcutFavoriteIdentifier, type FavoriteIdentifier } from "./favorites";
import type { Favorite } from "./models";

const storedFavorite: Favorite = {
  id: "favorite-1",
  userId: "profile-1",
  itemType: "shortcut",
  appSlug: "safari",
  keymapTitle: "Default",
  sectionTitle: "Tabs",
  shortcutTitle: "New Tab",
  baseShortcutId: "stable-id",
};

describe("favorite identity", () => {
  it("uses the stable shortcut ID when both sides have one", () => {
    expect(
      matchesFavorite(storedFavorite, {
        itemType: "shortcut",
        appSlug: "safari",
        keymapTitle: "Default",
        sectionTitle: "Tabs",
        shortcutTitle: "Renamed New Tab",
        baseShortcutId: "stable-id",
      })
    ).toBe(true);
  });

  it("falls back to the title for legacy shortcut favorites", () => {
    expect(
      matchesFavorite(
        { ...storedFavorite, baseShortcutId: undefined },
        {
          itemType: "shortcut",
          appSlug: "safari",
          keymapTitle: "Default",
          sectionTitle: "Tabs",
          shortcutTitle: "New Tab",
          baseShortcutId: "new-stable-id",
        }
      )
    ).toBe(true);
  });

  it("matches app and keymap favorites at their own identity grain", () => {
    const app: FavoriteIdentifier = {
      itemType: "app",
      appSlug: "safari",
    };
    const keymap: FavoriteIdentifier = {
      itemType: "keymap",
      appSlug: "safari",
      keymapTitle: "Default",
    };

    expect(matchesFavorite({ id: "app-favorite", userId: "profile-1", ...app }, app)).toBe(true);
    expect(matchesFavorite({ id: "keymap-favorite", userId: "profile-1", ...keymap }, keymap)).toBe(true);
  });

  it("builds shortcut favorite identity from the stable public shortcut fields", () => {
    expect(
      toShortcutFavoriteIdentifier({ slug: "safari", customAppId: undefined }, "Default", "Renamed Tabs", {
        title: "Renamed New Tab",
        sequence: [],
        baseSectionTitle: "Tabs",
        baseShortcutTitle: "New Tab",
        baseShortcutId: "stable-id",
      })
    ).toEqual({
      itemType: "shortcut",
      appSlug: "safari",
      customAppId: undefined,
      keymapTitle: "Default",
      sectionTitle: "Tabs",
      shortcutTitle: "New Tab",
      baseShortcutId: "stable-id",
    });
  });

  it("writes absent identity fields as null for PostgREST uniqueness", () => {
    expect(
      toFavoriteInsert("profile-1", {
        itemType: "app",
        appSlug: "safari",
      })
    ).toEqual({
      user_id: "profile-1",
      item_type: "app",
      app_slug: "safari",
      keymap_title: null,
      section_title: null,
      shortcut_title: null,
      base_shortcut_id: null,
      custom_app_id: null,
      custom_keymap_id: null,
      custom_shortcut_id: null,
    });
  });
});
