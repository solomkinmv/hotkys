import { ShortcutsParser } from "./input-parser";
import { InputApp } from "../model/input/input-models";
import { AppShortcuts, AtomicShortcut } from "../model/internal/internal-models";
import { Modifiers } from "../model/internal/modifiers";

describe("Parses shortcut correctly", () => {
  const keyCodes = new Map([["e", "10"]]);
  const parser = new ShortcutsParser(keyCodes);

  it("Parses app shortcut", () => {
    expect(parser.parseInputShortcuts([generateInputAppWithShortcut()])).toEqual([generateExpectedAppWithShortcut()]);
  });

  it("Parses shortcut without modifiers", () => {
    const expectedShortcutSequence: AtomicShortcut[] = [
      {
        base: "e",
        modifiers: [],
        runnable: true,
      },
    ];

    expect(parser.parseInputShortcuts([generateInputAppWithShortcut({ shortcut: "e" })])).toEqual([
      generateExpectedAppWithShortcut({
        shortcutSequence: expectedShortcutSequence,
      }),
    ]);
  });

  it("Parses non-runnable shortcut", () => {
    const expectedShortcutSequence: AtomicShortcut[] = [
      {
        base: "(click)",
        modifiers: [Modifiers.command],
        runnable: false,
      },
    ];

    expect(parser.parseInputShortcuts([generateInputAppWithShortcut({ shortcut: "cmd+(click)" })])).toEqual([
      generateExpectedAppWithShortcut({
        shortcutSequence: expectedShortcutSequence,
        runnableSequence: false
      }),
    ]);
  });
});

function generateInputAppWithShortcut(override?: { shortcut: string }): InputApp {
  return {
    bundleId: "some-bundle-id",
    name: "some-name",
    keymaps: [
      {
        title: "keymap-name",
        sections: [
          {
            title: "section-name",
            shortcuts: [
              {
                title: "shortcut",
                key: override?.shortcut ?? "cmd+e",
              },
            ],
          },
        ],
      },
    ],
  };
}

function generateExpectedAppWithShortcut(override?: { shortcutSequence?: AtomicShortcut[], runnableSequence?: boolean }): AppShortcuts {
  return {
    bundleId: "some-bundle-id",
    name: "some-name",
    keymaps: [
      {
        title: "keymap-name",
        sections: [
          {
            title: "section-name",
            hotkeys: [
              {
                title: "shortcut",
                sequence: override?.shortcutSequence ?? [
                  {
                    base: "e",
                    modifiers: [Modifiers.command],
                    runnable: true,
                  },
                ],
                runnable: override?.runnableSequence ?? true
              },
            ],
          },
        ],
      },
    ],
  };
}
