import { describe, expect, it } from "@jest/globals";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import type { UserCustomizations } from "@/lib/model/user/user-models";
import type { AppShortcuts } from "./internal-models";
import { summarizeApp, summarizeApps } from "./app-summary";

const app: AppShortcuts = {
  name: "Sample",
  slug: "sample",
  icon: "icons/sample.png",
  bundleId: "com.example.sample",
  hostname: "sample.example.com",
  source: "https://example.com/docs",
  keymaps: [
    {
      title: "macOS",
      platforms: ["macos"],
      sections: [
        {
          title: "Editing",
          hotkeys: [
            { title: "Copy secret", sequence: [{ base: "c", modifiers: [] }] },
            { title: "Paste secret", sequence: [] },
          ],
        },
        { title: "View", hotkeys: [{ title: "Zoom secret", sequence: [] }] },
      ],
    },
    { title: "Default", sections: [] },
  ],
};

const emptyCustomizations: UserCustomizations = {
  customApps: [],
  customKeymaps: [],
  shortcuts: [],
  favorites: [],
};

describe("summarizeApp", () => {
  it("keeps list metadata and per-keymap counts without shortcut data", () => {
    const summary = summarizeApp(app);
    expect(summary).toEqual({
      name: "Sample",
      slug: "sample",
      icon: "icons/sample.png",
      keymaps: [
        { title: "macOS", platforms: ["macos"], shortcutCount: 3 },
        { title: "Default", shortcutCount: 0 },
      ],
    });
    expect(JSON.stringify(summary)).not.toContain("secret");
  });

  it("keeps custom app and keymap identities used for routing", () => {
    expect(
      summarizeApp({
        ...app,
        customAppId: "private-id",
        keymaps: [{ ...app.keymaps[1], customKeymapId: "added-map" }],
      }),
    ).toMatchObject({
      customAppId: "private-id",
      keymaps: [{ title: "Default", customKeymapId: "added-map" }],
    });
  });

  it("summarizes merged apps exactly like base apps when there are no customizations", () => {
    const merged = new ShortcutMerger(emptyCustomizations).mergeShortcuts(
      [app],
      emptyCustomizations,
    );
    expect(summarizeApps(merged)).toEqual(summarizeApps([app]));
  });

  it("reflects hidden shortcuts and added keymaps after merging", () => {
    const customizations: UserCustomizations = {
      ...emptyCustomizations,
      shortcuts: [
        {
          baseKey: "sample:macOS:Editing:Paste secret",
          modification: { id: "overlay-1", isDeleted: true },
        },
      ],
      customKeymaps: [
        {
          id: "added-map",
          baseAppSlug: "sample",
          title: "Mine",
          sections: [
            {
              id: "section-1",
              keymapId: "added-map",
              title: "Custom",
              sortOrder: 0,
              shortcuts: [
                {
                  id: "shortcut-1",
                  title: "Run",
                  key: "cmd+r",
                  isDeleted: false,
                  sortOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    };
    const [summary] = summarizeApps(
      new ShortcutMerger(customizations).mergeShortcuts([app], customizations),
    );
    expect(summary.keymaps).toEqual([
      { title: "macOS", platforms: ["macos"], shortcutCount: 2 },
      { title: "Default", shortcutCount: 0 },
      { title: "Mine", customKeymapId: "added-map", shortcutCount: 1 },
    ]);
  });
});
