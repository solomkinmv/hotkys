import { describe, expect, it } from "@jest/globals";
import type { CustomApp } from "@/lib/model/user/user-models";
import { exportService } from "./export-service";

describe("exportService", () => {
  it("rejects custom apps that do not meet official shortcut validation", () => {
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
                  key: "cmd+k+p",
                  isDeleted: false,
                  sortOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    };

    expect(() => exportService.exportCustomApp(app)).toThrow(
      "Modifier doesn't exist: 'cmd+k+p'"
    );
  });
});
