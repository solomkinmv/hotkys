import fs from "node:fs";
import path from "node:path";
import type { InputApp } from "../model/input/input-models";
import { supportsPlatform } from "../shortcut-core/platforms";
import { ShortcutsParser } from "./input-parser";
import { getWindowsKeyNames } from "./windows-key-names";
import { validateWindowsSequence } from "../engine/windows-shortcut-runner";
jest.mock("@raycast/utils", () => ({ runPowerShellScript: jest.fn() }));

it("parses every Windows catalogue app and validates every declared binding for execution", () => {
  const directory = path.join(__dirname, "../../../shortcuts-disco-site/shortcuts-data");
  const parser = new ShortcutsParser(getWindowsKeyNames());
  let count = 0;
  const unsupported: unknown[] = [];
  for (const filename of fs.readdirSync(directory).filter((file) => file.endsWith(".json"))) {
    const app = JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8")) as InputApp;
    app.keymaps = app.keymaps.filter((keymap) => supportsPlatform(keymap.platforms, "windows"));
    if (!app.keymaps.length) continue;
    const parsed = parser.parseInputShortcuts([app]);
    expect({ slug: app.slug, parsed: parsed.length }).toEqual({ slug: app.slug, parsed: 1 });
    for (const keymap of parsed[0].keymaps)
      for (const section of keymap.sections)
        for (const shortcut of section.hotkeys) {
          if (shortcut.sequence.length) {
            try {
              validateWindowsSequence(shortcut.sequence);
            } catch {
              unsupported.push({
                app: app.slug,
                keymap: keymap.title,
                title: shortcut.title,
                sequence: shortcut.sequence,
              });
            }
          }
        }
    count++;
  }
  expect(unsupported).toEqual([]);
  expect(count).toBeGreaterThan(20);
});
