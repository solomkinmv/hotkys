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

/**
 * Attempts to convert the key representations in the given app to the format 
 * expected by Hotkys. Works directly on the input object.
 */
export function prettifyApp(inputApp: InputApp) {
    console.log(`Prettifying app: ${inputApp.name}`)
    inputApp.keymaps.forEach((inputKeymap) => {
        inputKeymap.sections.forEach((inputSection) => {
            inputSection.shortcuts.forEach((inputShortcut) => {
                inputShortcut.key = inputShortcut?.key ? 
                    sortShortcutKeys(canonicalizeKeys(inputShortcut.key))
                    : undefined;
            });
        });
    });
}

/**
 * Converts common non-standard key representations to the standard used by Hotkys
 */
function canonicalizeKeys(key: string): string {
    let k = key.toLowerCase();
    const toReplace = [
        [/option/g, "opt"],
        [/command/g, "cmd"],
        [/escape/g, "esc"],
        [/pgup/g, "pageup"],
        [/pgdown/g, "pagedown"],
    ] as [RegExp, string][];
    for (const _args of toReplace) {
        // @ts-ignore there _does_ exist a replace(r: RegExp, s: string) signature...
        k = k.replace.apply(k, _args);
    }
    return k
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

// If run directly via the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    prettifyAppShortcuts();
}
