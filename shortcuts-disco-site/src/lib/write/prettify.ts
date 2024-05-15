import {loadAllApps} from "@/lib/load/app-loader";
import {writeAppShortcut} from "@/lib/write/app-writer";
import {InputApp} from "@/lib/model/input/input-models";
import {modifierTokensOrderMapping} from "@/lib/model/internal/modifiers";

export function prettifyAppShortcuts() {
    const allApps = loadAllApps();
    for (let inputApp of allApps.list) {
        prettifyApp(inputApp);
        writeAppShortcut(inputApp);
    }
}

function prettifyApp(inputApp: InputApp) {
    console.log(`Prettifying app: ${inputApp.name}`)
    inputApp.keymaps.forEach((inputKeymap) => {
        inputKeymap.sections.forEach((inputSection) => {
            inputSection.shortcuts.forEach((inputShortcut) => {
                inputShortcut.key = inputShortcut?.key ? sortShortcutKeys(inputShortcut.key) : undefined;
            });
        });
    });
}

function sortShortcutKeys(key: string): string {
    return key.split(" ").map(sortChord).join(" ");
}

function sortChord(chord: string): string {
    const chordTokens = chord.split(/(?<!\+)\+/);
    const totalNumberOfTokens = chordTokens.length;
    const modifiers = chordTokens.slice(0, totalNumberOfTokens - 1);
    modifiers.sort((a, b) => {
        return modifierTokensOrderMapping.get(a)! - modifierTokensOrderMapping.get(b)!;
    });

    modifiers.push(chordTokens[totalNumberOfTokens - 1]);
    return modifiers.join("+");
}

prettifyAppShortcuts();
