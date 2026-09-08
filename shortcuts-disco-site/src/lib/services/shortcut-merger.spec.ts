import { describe, expect, it } from "@jest/globals";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";
import type { UserCustomizations } from "@/lib/model/user/user-models";
import { ShortcutMerger } from "./shortcut-merger";

describe("ShortcutMerger", () => {
  it("adds account-local shortcuts to matching official app sections", () => {
    const baseApp: AppShortcuts = {
      name: "Sample",
      slug: "sample",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "General",
              hotkeys: [
                {
                  title: "Copy",
                  sequence: [{ base: "c", modifiers: [] }],
                },
              ],
            },
          ],
        },
      ],
    };
    const customizations = {
      customApps: [],
      customKeymaps: [
        {
          id: "keymap-1",
          baseAppSlug: "sample",
          title: "Default",
          sections: [
            {
              id: "section-1",
              keymapId: "keymap-1",
              title: "General",
              sortOrder: 0,
              shortcuts: [
                {
                  id: "shortcut-1",
                  sectionId: "section-1",
                  title: "Open command palette",
                  key: "cmd+k",
                  comment: "Opens commands",
                  isDeleted: false,
                  sortOrder: 0,
                },
              ],
            },
          ],
        },
      ],
      shortcuts: [],
      favorites: [],
    } as UserCustomizations;

    const [mergedApp] = new ShortcutMerger(customizations).mergeShortcuts(
      [baseApp],
      customizations
    );

    expect(mergedApp.keymaps[0].sections[0].hotkeys).toEqual([
      {
        title: "Copy",
        sequence: [{ base: "c", modifiers: [] }],
        baseShortcutId: '[[["c",[]]],"Copy","",0]',
        baseSectionTitle: "General",
        baseShortcutTitle: "Copy",
      },
      {
        title: "Open command palette",
        sequence: [{ base: "k", modifiers: ["command down"] }],
        comment: "Opens commands",
        customizationStatus: "created",
        customizationId: "shortcut-1",
          customShortcutId: "shortcut-1",
      },
    ]);
  });

  it("applies an overlay only to the matching duplicate-title shortcut", () => {
    const baseApp: AppShortcuts = {
      name: "Sample",
      slug: "sample",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "General",
              hotkeys: [
                {
                  title: "Activate focused element",
                  sequence: [{ base: "Enter", modifiers: [] }],
                },
                {
                  title: "Activate focused element",
                  sequence: [{ base: "Space", modifiers: [] }],
                },
              ],
            },
          ],
        },
      ],
    };
    const customizations: UserCustomizations = {
      customApps: [],
      customKeymaps: [],
      shortcuts: [
        {
          baseKey: "sample:Default:General:Activate focused element",
          baseShortcutId:
            '[[["Space",[]]],"Activate focused element","",0]',
          modification: {
            id: "overlay-1",
            title: "Activate focused element with Space",
            key: "space",
            isDeleted: false,
          },
        },
      ],
      favorites: [],
    };

    const [mergedApp] = new ShortcutMerger(customizations).mergeShortcuts(
      [baseApp],
      customizations,
    );

    expect(mergedApp.keymaps[0].sections[0].hotkeys.map((shortcut) => shortcut.title))
      .toEqual([
        "Activate focused element",
        "Activate focused element with Space",
      ]);
  });

  it("ignores a stale legacy overlay after an identity overlay is saved", () => {
    const baseApp: AppShortcuts = {
      name: "Sample",
      slug: "sample",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "General",
              hotkeys: [
                {
                  title: "Activate focused element",
                  sequence: [{ base: "Enter", modifiers: [] }],
                },
                {
                  title: "Activate focused element",
                  sequence: [{ base: "Space", modifiers: [] }],
                },
              ],
            },
          ],
        },
      ],
    };
    const customizations: UserCustomizations = {
      customApps: [],
      customKeymaps: [],
      shortcuts: [
        {
          baseKey: "sample:Default:General:Activate focused element",
          modification: {
            id: "legacy-overlay",
            title: "Legacy title",
            isDeleted: false,
          },
        },
        {
          baseKey: "sample:Default:General:Activate focused element",
          baseShortcutId:
            '[[["Space",[]]],"Activate focused element","",0]',
          modification: {
            id: "identity-overlay",
            title: "Space title",
            isDeleted: false,
          },
        },
      ],
      favorites: [],
    };

    const [mergedApp] = new ShortcutMerger(customizations).mergeShortcuts(
      [baseApp],
      customizations,
    );

    expect(
      mergedApp.keymaps[0].sections[0].hotkeys.map(
        (shortcut) => shortcut.title,
      ),
    ).toEqual(["Activate focused element", "Space title"]);
  });
});
