import Validator, { ValidationError } from "./validator";
import { InputApp } from "../model/input/input-models";
import { AppShortcuts, AtomicShortcut } from "../model/internal/internal-models";
import { Modifiers } from "../model/internal/modifiers";

// todo: validate all lowercase
// todo: validate no spaces
// todo: base in supported list
// todo: the same keymap names per app
// todo: the same section names
// todo: the same shortcut names (in section?)
// todo: the same app bundle ids or names
// todo: single keymap should be named "Default"

describe("Throws validation error", () => {
  const validator = new Validator(new Map([["e", "10"]]));

  it("Throws validation error if incorrect modifier", () => {
    expect(() => validator.validate([generateInputAppWithShortcut({ shortcut: "abc+e" })])).toThrowError(
      new ValidationError("Modifier 'abc' doesn't exist")
    );
  });

  it("Throw validation error if base key unknown", () => {
    expect(() => validator.validate([generateInputAppWithShortcut({ shortcut: "abc+💩" })])).toThrowError(
      new ValidationError("Modifier 'abc' doesn't exist")
    );
  });

  it("Throws validation error if there are whitespace in shortcut", () => {
    expect(() => validator.validate([generateInputAppWithShortcut({ shortcut: "cmd+e +e" })])).toThrowError(
      new ValidationError("Invalid shortcut: 'cmd+e +e'")
    );
  });

  it.each(["opt+ctrl+e", "cmd+ctrl+e", "shift+ctrl+e", "opt+shift+e", "cmd+opt+e", "ctrl+shift+opt+cmd+e cmd+opt+e"])(
    "Throws validation error if modifiers are not in order %p",
    (shortcut: string) => {
      expect(() => validator.validate([generateInputAppWithShortcut({ shortcut })])).toThrowError(
        new ValidationError(
          `Modifiers have incorrect order. Received: '${shortcut}'. Correct order: ctrl, shift, opt, cmd`
        )
      );
    }
  );

  it.each([
    "ctrl+shift+opt+cmd+e",
    "ctrl+opt+cmd+e",
    "shift+opt+e",
    "ctrl+shift+e",
    "opt+cmd+e",
    "ctrl+cmd+e",
    "ctrl+shift+opt+e",
    "ctrl+shift+cmd+e",
    "ctrl+opt+cmd+e",
    "shift+opt+cmd+e",
    "ctrl+shift+opt+cmd+e ctrl+opt+cmd+e shift+opt+e ctrl+shift+e opt+cmd+e ctrl+cmd+e ctrl+shift+opt+e ctrl+shift+cmd+e ctrl+opt+cmd+e shift+opt+cmd+e",
  ])("Validation succeed if modifiers are in order %p", (shortcut: string) => {
    expect(() => validator.validate([generateInputAppWithShortcut({ shortcut })])).not.toThrowError();
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
