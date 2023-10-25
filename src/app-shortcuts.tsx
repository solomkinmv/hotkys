import { ActionPanel, Detail, List, Action, getFrontmostApplication } from "@raycast/api";
import { showHUD, environment } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { useState } from "react";
import { Modifers, modifierSymbols } from "./model/modifiers";
import { keyCodes } from "./model/key-codes";
import { AppHotkeys, Keymap, SectionHotkey } from "./model/models";
import { hotkeys } from "./model/hotkeys";


async function triggerHotkey(bundleId: string, key: string, modifiers: Modifers[]) {
    runAppleScript(
        `
    function run(argv) {
      const app = Application.currentApplication();
      app.includeStandardAdditions = true;

      const targetBundleID = argv[0];

      // Activate the target application
      const systemEvents = Application('System Events');
      if (systemEvents.applicationProcesses.whose({ bundleIdentifier: targetBundleID }).length > 0) {
          app.doShellScript("open -b " + targetBundleID);
          delay(2); // Adjust the delay as needed for the app to activate
      }

      // Trigger the shortcut
      const modifiers = [];
      for (var i = 0; i <= 4; i++) {
        if (argv[2 + i] !== undefined) {
          modifiers.push(argv[2 + i]);
        }
      }
      systemEvents.keyCode(parseInt(argv[1]), {
          using: modifiers
      })
    }
    `,
        [bundleId, keyCodes.get(key)!, ...modifiers],
        {
            language: "JavaScript"
        }
    )
}

async function runAS8(key: string, modifiers: Modifers[]) {
    const frontmostApplication = await getFrontmostApplication();
    triggerHotkey(frontmostApplication.bundleId!, key, modifiers)

    console.log(`v8: The frontmost application is: ${frontmostApplication.bundleId!}`);
    await showHUD(frontmostApplication.bundleId!);
}

async function hudFrontApp() {
    const frontmostApplication = await getFrontmostApplication();
    console.log(`The frontmost application is: ${frontmostApplication.name}`);
    await showHUD(JSON.stringify(frontmostApplication));
}

function KeymapDropdown(props: { keymaps: string[]; onKeymapChange: (newValue: string) => void }) {
    const { keymaps, onKeymapChange } = props;
    return (
        <List.Dropdown
            tooltip="Select Keymap"
            storeValue={true}
            onChange={(newValue) => {
                onKeymapChange(newValue);
            }}
        >
            <List.Dropdown.Section title="Keymaps">
                {keymaps.map(keymap => (
                    <List.Dropdown.Item key={keymap} title={keymap} value={keymap} />
                ))}
            </List.Dropdown.Section>
        </List.Dropdown>
    );
}

export default function AppShortcuts(props: {bundleId: string} | undefined) {
    const bundleId = props?.bundleId ?? environment.launchContext?.appBundleId;
    console.log(`Received ${bundleId}`)
    const [appHotkeys, setAppHotkeys] = useState<AppHotkeys | undefined>(hotkeys.applications.find(app => app.bundleId === bundleId));
    const [keymaps, setKeymaps] = useState<string[]>(appHotkeys?.keymaps.map(k => k.title) ?? [])
    const [keymapShortcuts, setKeymapShortcuts] = useState<Keymap | undefined>(appHotkeys?.keymaps[0])
    if (!keymapShortcuts) {
        return <Detail markdown="Sorry, no current app found 👋" />;
    }

    const onKeymapChange = (newValue: string) => {
        setKeymapShortcuts(selectKeymap(appHotkeys?.keymaps ?? [], newValue))
    };
    return (
        <List navigationTitle="Search Beers"
            searchBarPlaceholder="Search for hotkeys"
            searchBarAccessory={<KeymapDropdown keymaps={keymaps} onKeymapChange={onKeymapChange} />}
        >
            {
                keymapShortcuts.sections.map(section => {
                    return <List.Section
                        key={section.title}
                        title={section.title}
                    >
                        {
                            section.hotkeys.map(hotkey => {
                                return <List.Item
                                    key={hotkey.title}
                                    title={hotkey.title}
                                    subtitle={generateHotkeyText(hotkey)}
                                    actions={
                                        <ActionPanel>
                                            <Action title="Apply" onAction={() => runAS8(hotkey.key, hotkey.modifiers)} />
                                        </ActionPanel>
                                    }
                                />
                            })
                        }
                    </List.Section>
                })
            }
        </List>
    );
}

function selectKeymap(keymaps: Keymap[], keymapName: string): Keymap | undefined {
    return keymaps.find(keymap => keymap.title === keymapName)
}

function generateHotkeyText(hotkey: SectionHotkey): string {
    return hotkey.modifiers.map(modifier => modifierSymbols.get(modifier)).join("") + hotkey.key;
}