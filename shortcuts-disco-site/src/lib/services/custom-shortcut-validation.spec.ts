import { describe, expect, it } from "@jest/globals";
import type { CustomApp } from "@/lib/model/user/user-models";
import {
  validateCustomApp,
  validateCustomShortcutDraft,
} from "./custom-shortcut-validation";

describe("custom shortcut validation", () => {
  it("accepts shortcut drafts that follow official shortcut syntax", () => {
    expect(() =>
      validateCustomShortcutDraft({
        title: "Open command palette",
        key: "cmd+k",
        comment: "Opens commands",
      })
    ).not.toThrow();
  });

  it("accepts shortcut drafts with clear format fixes", () => {
    expect(() =>
      validateCustomShortcutDraft({
        title: "Open command palette",
        key: "Cmd+K",
      })
    ).not.toThrow();

    expect(() =>
      validateCustomShortcutDraft({
        title: "Undo",
        key: "cmd+z+shift",
      })
    ).not.toThrow();
  });

  it("rejects long comments with the official comment limit", () => {
    expect(() =>
      validateCustomShortcutDraft({
        title: "Open command palette",
        key: "cmd+k",
        comment: "This comment is too long for the official data validator.",
      })
    ).toThrow(
      "Comment longer than 50 symbols: 'This comment is too long for the official data validator.'"
    );
  });

  it("validates complete custom apps before export", () => {
    const app: CustomApp = {
      id: "app-1",
      userId: "user-1",
      name: "Sample",
      slug: "sample",
      keymaps: [
        {
          id: "keymap-1",
          customAppId: "app-1",
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
    };

    expect(() => validateCustomApp(app)).not.toThrow();
  });

  it("validates complete custom apps with clear shortcut format fixes", () => {
    const app: CustomApp = {
      id: "app-1",
      userId: "user-1",
      name: "Sample",
      slug: "sample",
      keymaps: [
        {
          id: "keymap-1",
          customAppId: "app-1",
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
                  title: "Undo",
                  key: "cmd+z+shift",
                  isDeleted: false,
                  sortOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    };

    expect(() => validateCustomApp(app)).not.toThrow();
  });
});
