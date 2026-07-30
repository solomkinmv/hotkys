import type { AppMetadata } from "../model/input/input-models";
import type { Favorite, UserCustomizations } from "./models";
import { mergeAppMetadata, selectAppsByFilter, selectCustomizedApps } from "./view-models";

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

  it("keeps every merged application in the all-apps filter", () => {
    const apps = mergeAppMetadata(baseApps, customizations());

    expect(selectAppsByFilter(apps, customizations(), [], "all").map((app) => app.slug)).toEqual([
      "safari",
      "finder",
      "custom-my-editor",
    ]);
  });

  it("shows custom applications and public applications with custom shortcuts in the my-apps filter", () => {
    const apps = mergeAppMetadata(baseApps, customizations());

    expect(selectAppsByFilter(apps, customizations(), [], "customized").map((app) => app.slug)).toEqual([
      "safari",
      "custom-my-editor",
    ]);
  });

  it("shows only applications with app-level favorites in the favorites filter", () => {
    const apps = mergeAppMetadata(baseApps, customizations());
    const favorites: Favorite[] = [
      {
        id: "favorite-app",
        userId: "profile-1",
        itemType: "app",
        appSlug: "finder",
      },
      {
        id: "favorite-shortcut",
        userId: "profile-1",
        itemType: "shortcut",
        appSlug: "safari",
        keymapTitle: "Default",
        sectionTitle: "Tabs",
        shortcutTitle: "New Tab",
      },
      {
        id: "favorite-keymap",
        userId: "profile-1",
        itemType: "keymap",
        customAppId: "custom-app-1",
        keymapTitle: "Default",
      },
    ];

    expect(selectAppsByFilter(apps, customizations(), favorites, "favorites").map((app) => app.slug)).toEqual([
      "finder",
    ]);
  });
});
