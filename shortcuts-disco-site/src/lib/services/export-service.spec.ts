import { describe, expect, it } from "@jest/globals";
import type { CustomApp } from "@/lib/model/user/user-models";
import { exportService } from "./export-service";

describe("exportService", () => {
  it("includes the required shortcut schema reference", () => {
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
                  isDeleted: false,
                  sortOrder: 0,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = exportService.exportCustomApp(app);

    expect(result.app.$schema).toBe("https://hotkys.com/schema/shortcut.schema.json");
    expect(JSON.parse(result.json).$schema).toBe("https://hotkys.com/schema/shortcut.schema.json");
  });

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

function privateFixture(): CustomApp {
  return { id: "private-app-id", userId: "private-user-id", slug: "example", name: "Example", hostname: "example.com", source: "https://example.com/shortcuts", keymaps: [{ id: "private-keymap-id", customAppId: "private-app-id", title: "Default", platforms: ["macos", "linux"], sections: [{ id: "private-section-id", keymapId: "private-keymap-id", title: "General", sortOrder: 0, shortcuts: [{ id: "private-shortcut-id", sectionId: "private-section-id", title: "Zoom", key: "cmd++", comment: "Zoom in", sortOrder: 0, isDeleted: false }] }] }] };
}
it("exports an allowlist of public fields in deliberate order without account metadata", () => {
  const app = privateFixture();
  Object.assign(app, { email: "private@example.com", token: "private-token", favorites: ["secret"], created_at: "private-time", otherApps: ["private-app"] });
  Object.assign(app.keymaps[0].sections[0].shortcuts[0], { keyIsCleared: false, commentIsCleared: false, user_id: "private-user-id" });
  const { json } = exportService.exportCustomApp(app);
  expect(json).not.toMatch(/private-|private@|user_id|favorites|otherApps|IsCleared|created_at/);
  expect(JSON.parse(json)).toEqual({ $schema: "https://hotkys.com/schema/shortcut.schema.json", slug: "example", name: "Example", hostname: "example.com", source: "https://example.com/shortcuts", keymaps: [{ title: "Default", platforms: ["macos", "linux"], sections: [{ title: "General", shortcuts: [{ title: "Zoom", key: "cmd++", comment: "Zoom in" }] }] }] });
});
it("rejects incomplete drafts and route collisions before offering an export", () => {
  const app = privateFixture(); app.keymaps[0].sections[0].shortcuts = [];
  expect(() => exportService.exportCustomApp(app)).toThrow("General");
  app.keymaps = privateFixture().keymaps; app.keymaps.push({ ...app.keymaps[0], title: "Default!" });
  expect(() => exportService.exportCustomApp(app)).toThrow("duplicated URL");
  app.keymaps = privateFixture().keymaps; app.slug = "apps";
  expect(() => exportService.exportCustomApp(app)).toThrow("reserved slug");
});
