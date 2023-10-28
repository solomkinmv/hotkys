import { InputApp, InputShortcut } from "../model/input/input-models";
import { modifierMapping, Modifiers } from "../model/internal/modifiers";

// todo: validate modifiers
// todo: validate modifiers order
// todo: validate all lowercase
// todo: validate no spaces
// todo: base in supported list
// todo: the same keymap names per app
// todo: the same section names
// todo: the same shortcut names (in section?)
// todo: the same app bundle ids or names

export function validate(inputApps: InputApp[]): void {
  inputApps.forEach((inputApp) => {
    inputApp.keymaps.forEach((inputKeymap) => {
      inputKeymap.sections.forEach((inputSection) => {
        inputSection.shortcuts.forEach(validateShortcut);
      });
    });
  });
}

function validateShortcut(inputShortcut: InputShortcut): void {
  inputShortcut.key.split(" ").forEach(validateChord);
}

function validateChord(chord: string): void {
  const chordTokens = chord.split("+");
  const totalNumberOfTokens = chordTokens.length;
  for (let i = 0; i < totalNumberOfTokens - 1; i++) {
    const token = chordTokens[i];
    if (token === "") {
      throw new ValidationError(`Invalid shortcut chord: '${chord}'`);
    }
    const modifier = modifierMapping.get(token);
    if (modifier === undefined) {
      throw new ValidationError(`Modifier '${token}' doesn't exist`);
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype); // Ensure proper inheritance
  }
}
