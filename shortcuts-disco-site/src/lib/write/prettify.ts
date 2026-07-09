import {loadAllApps} from "@/lib/load/app-loader";
import {writeAppShortcut} from "@/lib/write/app-writer";
import {InputApp} from "@/lib/model/input/input-models";
import {normalizeShortcutKey} from "@/lib/shortcut-key-format";

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
                    normalizeShortcutKey(inputShortcut.key)
                    : undefined;
            });
        });
    });
}

// If run directly via the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    prettifyAppShortcuts();
}
