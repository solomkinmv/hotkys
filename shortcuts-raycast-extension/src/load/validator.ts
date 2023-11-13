import { InputApp, InputShortcut } from "../model/input/input-models";
import { modifierMapping, modifierTokensOrderMapping } from "../model/internal/modifiers";

export default class Validator {
  constructor(private readonly keyCodes: Map<string, string>) {
  }

  public validate(inputApps: InputApp[]): void {
    inputApps.forEach((inputApp) => {
      inputApp.keymaps.forEach((inputKeymap) => {
        inputKeymap.sections.forEach((inputSection) => {
          inputSection.shortcuts.forEach(this.validateShortcut.bind(this));
        });
      });
    });
  }

  private validateShortcut(inputShortcut: InputShortcut): void {
    inputShortcut.key?.split(" ").forEach((chord) => this.validateChord(inputShortcut.key!, chord));
    if (inputShortcut.title.length > 50) {
      throw new ValidationError(`Title longer than 50 symbols: '${inputShortcut.title}'`);
    }
    if (inputShortcut.comment && inputShortcut.comment.length > 50) {
      throw new ValidationError(`Comment longer than 50 symbols: '${inputShortcut.comment}'`);
    }
    if (inputShortcut.key === undefined && inputShortcut.comment === undefined) {
      throw new ValidationError(`Shortcut '${inputShortcut.title}' should contains at least key or comment`); // todo: add test
    }
  }

  private validateChord(fullShortcutKey: string, chord: string): void {
    const chordTokens = chord.split("+");
    const totalNumberOfTokens = chordTokens.length;
    this.validateModifiersExist(totalNumberOfTokens, chordTokens, fullShortcutKey);
    this.validateOrderOfModifiers(totalNumberOfTokens, chordTokens, fullShortcutKey);
    this.validateBaseShortcutToken(chordTokens[totalNumberOfTokens - 1], fullShortcutKey)
  }

  private validateModifiersExist(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
    for (let i = 0; i < totalNumberOfTokens - 1; i++) {
      const token = chordTokens[i];
      if (token === "") {
        throw new ValidationError(`Invalid shortcut: '${fullShortcutKey}'`);
      }
      const modifier = modifierMapping.get(token);
      if (modifier === undefined) {
        throw new ValidationError(`Modifier '${token}' doesn't exist`);
      }
    }
  }

  private validateOrderOfModifiers(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
    for (let i = 0; i < totalNumberOfTokens - 2; i++) {
      const idx1 = modifierTokensOrderMapping.get(chordTokens[i]) ?? -1;
      const idx2 = modifierTokensOrderMapping.get(chordTokens[i + 1]) ?? -1;
      if (idx1 < 0 || idx2 < 0 || idx1 >= idx2) {
        throw new ValidationError(
            `Modifiers have incorrect order. Received: '${fullShortcutKey}'. Correct order: ctrl, shift, opt, cmd`,
        );
      }
    }
  }

  private validateBaseShortcutToken(baseToken: string, fullShortcutKey: string) {
    if (this.keyCodes.has(baseToken)) return;
    if (modifierMapping.has(baseToken)) {
      throw new ValidationError(`Shortcut expression should end with base key: '${fullShortcutKey}'`);
    }
    throw new ValidationError(`Unknown base key for shortcut: '${fullShortcutKey}'`);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype); // Ensure proper inheritance
  }
}
