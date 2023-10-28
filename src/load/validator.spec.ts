import { validate, ValidationError } from "./validator";
import { InputApp } from "../model/input/input-models";
import { AppShortcuts, AtomicShortcut } from "../model/internal/internal-models";
import { Modifiers } from "../model/internal/modifiers";

describe("Throws validation errors", () => {
  it("Throws validation error if incorrect modifier", () => {
    expect(() => validate([generateInputAppWithShortcut({ shortcut: "abc+e" })])).toThrowError(
      new ValidationError("Modifier 'abc' doesn't exist")
    );
  });

  it("Throws validation error if there are whitespace in shortcut", () => {
    expect(() => validate([generateInputAppWithShortcut({ shortcut: "cmd +e" })])).toThrowError(
      new ValidationError("Invalid shortcut chord: '+e'")
    );
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

function generateExpectedAppWithShortcut(override?: { shortcutSequence: AtomicShortcut[] }): AppShortcuts {
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
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
