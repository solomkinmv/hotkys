import {AppShortcuts, AtomicShortcut, SectionShortcut} from "@/lib/model/internal/internal-models";
import {modifierMapping, Modifiers} from "@/lib/model/internal/modifiers";
import {InputApp, InputShortcut} from "@/lib/model/input/input-models";

export class ShortcutsParser {

    public parseInputShortcuts(inputApps: InputApp[]): AppShortcuts[] {
        return inputApps.map((inputApp) => {
            return {
                name: inputApp.name,
                bundleId: inputApp.bundleId,
                slug: inputApp.slug,
                source: inputApp.source,
                keymaps: inputApp.keymaps.map((inputKeymap) => {
                    return {
                        title: inputKeymap.title,
                        platform: inputKeymap.platform,
                        sections: inputKeymap.sections.map((inputSection) => {
                            return {
                                title: inputSection.title,
                                hotkeys: inputSection.shortcuts.map((inputShortcut) => this.parseSingleShortcut(inputShortcut)),
                            };
                        }),
                    };
                }),
            };
        });
    }

    private parseSingleShortcut(inputShortcut: InputShortcut): SectionShortcut {
        const chords = inputShortcut.key?.split(" ");
        const atomicSequence = chords?.map((chord) => this.parseChord(chord));
        return {
            title: inputShortcut.title,
            sequence: atomicSequence ?? [],
            comment: inputShortcut.comment,
        };
    }

    private parseChord(chord: string): AtomicShortcut {
        const chordTokens = chord.split("+");
        const totalNumberOfTokens = chordTokens.length;
        const modifiers: Modifiers[] = [];
        for (let i = 0; i < totalNumberOfTokens - 1; i++) {
            const token = chordTokens[i];
            const modifier = modifierMapping.get(token)!;
            modifiers.push(modifier);
        }
        const baseToken = chordTokens[totalNumberOfTokens - 1];
        return {
            base: baseToken,
            modifiers: modifiers
        };
    }
}
