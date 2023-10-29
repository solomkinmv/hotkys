import { useParams } from "react-router-dom";
import { useShortcutsProvider } from "../../core/load/shortcuts-provider";
import { SectionShortcut } from "../../core/model/internal/internal-models";
import { modifierSymbols } from "../../core/model/internal/modifiers";

// const Paths = {
//     appShortcuts: "/apps/:bundleId",
// } as const;
//
// interface AppShortcutsLoaderArgs extends ActionFunctionArgs {
//     params: Params<ParamParseKey<typeof Paths.appShortcuts>>;
// }
//
//
// export async function loader({ params }: AppShortcutsLoaderArgs) {
//     const shortcutsProvider = new ShortcutsProvider();
//     const appShortcuts = shortcutsProvider.getShortcutsByApp(params.bundleId!); // todo: fix force unwrapping
//     return { appShortcuts };
// }
//
// interface LoadedData {
//     appShortcuts: AppShortcuts | undefined;
// }

export function AppShortcutsComponent() {
    let { bundleId } = useParams();
    const appShortcuts = useShortcutsProvider().getShortcutsByApp(bundleId!);
    return (
        <div>
            <h1>{appShortcuts?.name}</h1>
            <div>{appShortcuts?.bundleId}</div>
            {appShortcuts?.keymaps.map(keymap => {
                return (
                    <>
                        <h2>{keymap.title}</h2>
                        {keymap.sections.map(section => (
                            <>
                                <h3>{section.title}</h3>
                                {section.hotkeys.map(shortcut => (
                                    <>
                                        <h4>{shortcut.title}</h4>
                                        <div>{generateHotkeyText(shortcut)}</div>
                                    </>
                                ))}
                            </>
                        ))}
                    </>
                );
            })}
        </div>);
}

function generateHotkeyText(shortcut: SectionShortcut): string {
    return shortcut.sequence
        .map((atomicShortcut) => {
            const modifiersText = atomicShortcut.modifiers.map((modifier) => modifierSymbols.get(modifier)).join("") ?? "";
            return modifiersText + overrideSymbolIfPossible(atomicShortcut.base);
        })
        .join(" ");
}

function overrideSymbolIfPossible(base: string) {
    if (baseKeySymbolOverride.has(base)) {
        return baseKeySymbolOverride.get(base);
    }
    return base.toUpperCase();
}

const baseKeySymbolOverride: Map<string, string> = new Map([
    ["left", "←"],
    ["right", "→"],
    ["up", "↑"],
    ["down", "↓"],
    ["pageup", "PgUp"],
    ["pagedown", "PgDown"],
    ["home", "Home"],
    ["end", "End"],
    ["tab", "⇥"],
    ["esc", "⎋"],
]);
