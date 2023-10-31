import { InputApp, InputShortcut } from "../model/input/input-models";
import { modifierMapping, modifierTokensOrderMapping } from "../model/internal/modifiers";
import { keyCodes } from "../model/internal/key-codes";

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
    inputShortcut.key.split(" ").forEach((chord) => validateChord(inputShortcut.key, chord));
}

function validateChord(fullShortcutKey: string, chord: string): void {
    const chordTokens = chord.split("+");
    const totalNumberOfTokens = chordTokens.length;
    validateModifiersExist(totalNumberOfTokens, chordTokens, fullShortcutKey);
    validateOrderOfModifiers(totalNumberOfTokens, chordTokens, fullShortcutKey);
    if (!keyCodes.has(chordTokens[totalNumberOfTokens - 1])) {
        throw new ValidationError(`Unknown base key for shortcut: '${fullShortcutKey}'`);
    }
}

function validateModifiersExist(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
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

function validateOrderOfModifiers(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
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

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, new.target.prototype); // Ensure proper inheritance
    }
}
