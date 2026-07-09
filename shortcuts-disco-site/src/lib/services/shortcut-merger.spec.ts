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
      },
      {
        title: "Open command palette",
        sequence: [{ base: "k", modifiers: ["control down"] }],
        comment: "Opens commands",
        customizationStatus: "created",
        customizationId: "shortcut-1",
      },
    ]);
  });
});
