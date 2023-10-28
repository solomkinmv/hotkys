import { AppShortcuts, AtomicShortcut, SectionShortcut } from "../model/internal/internal-models";
import { Modifiers } from "../model/internal/modifiers";
import { InputApp, InputShortcut } from "../model/input/input-models";

export function parseInputShortcuts(inputApps: InputApp[]): AppShortcuts[] {
  return inputApps.map((inputApp) => {
    return {
      name: inputApp.name,
      bundleId: inputApp.bundleId,
      keymaps: inputApp.keymaps.map((inputKeymap) => {
        return {
          title: inputKeymap.title,
          sections: inputKeymap.sections.map((inputSection) => {
            return {
              title: inputSection.title,
              hotkeys: inputSection.shortcuts.map(parseSingleShortcut),
            };
          }),
        };
      }),
    };
  });
}

const modifierTokens: string[] = ["ctrl", "shift", "opt", "cmd"];
// todo: validate modifiers
// todo: validate modifiers order
// todo: validate all lowercase
// todo: validate no spaces
// todo: base in supported list
// todo: the same keymap names per app
// todo: the same section names
// todo: the same shortcut names (in section?)
// todo: the same app bundle ids or names

const modifierMapping: Map<string, Modifiers> = new Map([
  ["ctrl", Modifiers.control],
  ["shift", Modifiers.shift],
  ["opt", Modifiers.option],
  ["cmd", Modifiers.command],
]);

function parseSingleShortcut(inputShortcut: InputShortcut): SectionShortcut {
  const chords = inputShortcut.key.split(" ");
  const atomicSequence = chords.map((chord) => parseChord(chord));
  return {
    title: inputShortcut.title,
    sequence: atomicSequence,
  };
}

function parseChord(chord: string): AtomicShortcut {
  const modifierTokens = chord.split("+");
  const totalNumberOfTokens = modifierTokens.length;
  const modifiers: Modifiers[] = [];
  for (let i = 0; i < totalNumberOfTokens - 1; i++) {
    const token = modifierTokens[i];
    if (token === "") {
      throw new ValidationError(`Invalid shortcut chord: '${chord}'`);
    }
    const modifier = modifierMapping.get(token);
    if (modifier === undefined) {
      throw new ValidationError(`Modifier '${token}' doesn't exist`);
    }
    modifiers.push(modifier);
  }
  return {
    base: modifierTokens[totalNumberOfTokens - 1],
    modifiers: modifiers,
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype); // Ensure proper inheritance
  }
}
