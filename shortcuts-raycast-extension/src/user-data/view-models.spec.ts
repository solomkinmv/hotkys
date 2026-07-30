import type { AppMetadata } from "../model/input/input-models";
import type { Favorite, UserCustomizations } from "./models";
import { mergeAppMetadata, resolveFavoriteItem, selectCustomizedApps } from "./view-models";

const baseApps: AppMetadata[] = [
  {
    name: "Safari",
    slug: "safari",
    bundleId: "com.apple.Safari",
    keymaps: ["Default"],
  },
  {
    name: "Finder",
    slug: "finder",
    bundleId: "com.apple.finder",
    keymaps: ["Default"],
  },
];

function customizations(): UserCustomizations {
  return {
    customApps: [
      {
        id: "custom-app-1",
        userId: "profile-1",
        slug: "my-editor",
        name: "My Editor",
        bundleId: "com.example.editor",
        icon: "/icons/editor.png",
        keymaps: [
          {
            id: "custom-keymap",
            customAppId: "custom-app-1",
            title: "Default",
            sections: [],
          },
        ],
      },
    ],
    customKeymaps: [
      {
        id: "base-keymap",
        baseAppSlug: "safari",
        title: "Default",
        sections: [],
      },
    ],
    shortcuts: [],
    favorites: [],
  };
}

describe("Raycast user-data view models", () => {
  it("adds custom applications to public app metadata", () => {
    expect(mergeAppMetadata(baseApps, customizations())).toEqual([
      ...baseApps,
      {
        name: "My Editor",
        slug: "custom-my-editor",
        customAppId: "custom-app-1",
        bundleId: "com.example.editor",
        hostname: undefined,
        source: undefined,
        icon: "/icons/editor.png",
        keymaps: ["Default"],
      },
    ]);
  });

  it("selects custom apps and official apps with user customizations", () => {
    const apps = mergeAppMetadata(baseApps, customizations());

    expect(selectCustomizedApps(apps, customizations()).map((app) => app.slug)).toEqual(["safari", "custom-my-editor"]);
  });

  it("resolves a shortcut favorite to a readable navigation target", () => {
    const favorite: Favorite = {
      id: "favorite-1",
      userId: "profile-1",
      itemType: "shortcut",
      appSlug: "safari",
      keymapTitle: "Default",
      sectionTitle: "Tabs",
      shortcutTitle: "New Tab",
    };

    expect(resolveFavoriteItem(favorite, baseApps)).toEqual({
      id: "favorite-1",
      title: "New Tab",
      subtitle: "Safari › Default › Tabs",
      appSlug: "safari",
      keymapTitle: "Default",
      searchText: "New Tab",
    });
  });

  it("keeps unresolved favorites visible instead of dropping user data", () => {
    const favorite: Favorite = {
      id: "favorite-2",
      userId: "profile-1",
      itemType: "app",
      appSlug: "removed-app",
    };

    expect(resolveFavoriteItem(favorite, baseApps)).toEqual({
      id: "favorite-2",
      title: "removed-app",
      subtitle: "Application",
      appSlug: "removed-app",
      keymapTitle: undefined,
      searchText: undefined,
    });
  });
});
