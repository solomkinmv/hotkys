import { ActionPanel, Detail, List, Action, getFrontmostApplication } from "@raycast/api";
import { showHUD, environment } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { AppHotkeys, Modifers, SectionHotkey, hotkeys, keyCodes, modifierSymbols } from ".";


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

export default function Command() {
    const bundleId = environment.launchContext?.appBundleId;
    console.log(`Received ${bundleId}`)
    const appHotkeys: AppHotkeys | undefined = hotkeys.applications.find(app => app.bundleId === bundleId);
    if (!appHotkeys) {
        return <Detail markdown="Sorry, no current app found 👋" />;
    }
    return (
        <List>
            {
                appHotkeys.sections.map(section => {
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

function generateHotkeyText(hotkey: SectionHotkey): string {
    return hotkey.modifiers.map(modifier => modifierSymbols.get(modifier)).join("") + hotkey.key;
}