import { AppShortcuts, AtomicShortcut, SectionShortcut } from "../model/internal/internal-models";
import { modifierMapping, Modifiers } from "../model/internal/modifiers";
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

// todo: validate modifiers
// todo: validate modifiers order
// todo: validate all lowercase
// todo: validate no spaces
// todo: base in supported list
// todo: the same keymap names per app
// todo: the same section names
// todo: the same shortcut names (in section?)
// todo: the same app bundle ids or names

function parseSingleShortcut(inputShortcut: InputShortcut): SectionShortcut {
    const chords = inputShortcut.key.split(" ");
    const atomicSequence = chords.map((chord) => parseChord(chord));
    return {
        title: inputShortcut.title,
        sequence: atomicSequence,
    };
}

function parseChord(chord: string): AtomicShortcut {
    const chordTokens = chord.split("+");
    const totalNumberOfTokens = chordTokens.length;
    const modifiers: Modifiers[] = [];
    for (let i = 0; i < totalNumberOfTokens - 1; i++) {
        const token = chordTokens[i];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const modifier = modifierMapping.get(token)!;
        modifiers.push(modifier);
    }
    return {
        base: chordTokens[totalNumberOfTokens - 1],
        modifiers: modifiers,
    };
}
