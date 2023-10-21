import { ActionPanel, Detail, List, Action, getFrontmostApplication } from "@raycast/api";
import { showHUD, environment } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";


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
                                    icon="list-icon.png"
                                    key={hotkey.title}
                                    title={hotkey.title}
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

const keyCodes = new Map<string, string>([
    ["A", "0"],
    ["B", "11"],
    ["C", "8"],
    ["D", "2"],
    ["E", "14"],
    ["F", "3"],
    ["G", "5"],
    ["H", "4"],
    ["I", "34"],
    ["J", "38"],
    ["K", "40"],
    ["L", "37"],
    ["M", "46"],
    ["N", "45"],
    ["O", "31"],
    ["P", "35"],
    ["Q", "12"],
    ["R", "15"],
    ["S", "1"],
    ["T", "17"],
    ["U", "32"],
    ["V", "9"],
    ["W", "13"],
    ["X", "7"],
    ["Y", "16"],
    ["Z", "6"],
    ["tilde", "50"]
]);

enum Modifers {
    command = "command down",
    control = "control down",
    option = "option down",
    shift = "shift down"
}

interface SectionHotkey {
    title: string,
    key: string
    modifiers: Modifers[]
}

interface Section {
    title: string,
    hotkeys: SectionHotkey[]
}

interface AppHotkeys {
    bundleId: string,
    name: string,
    sections: Section[]
}

interface Hotkeys {
    applications: AppHotkeys[]
}

const hotkeys: Hotkeys = {
    applications: [
        {
            bundleId: "com.apple.dt.Xcode",
            name: "Xcode",
            sections: [
                {
                    title: "Build",
                    hotkeys: [
                        {
                            title: "Run",
                            key: "R",
                            modifiers: [Modifers.command]
                        },
                        {
                            title: "Build",
                            key: "B",
                            modifiers: [Modifers.command]
                        }
                    ]
                },
                {
                    title: "Format",
                    hotkeys: [
                        {
                            title: "Re-Indent",
                            key: "I",
                            modifiers: [Modifers.control]
                        }
                    ]
                }
            ]
        },
        {
            bundleId: "com.microsoft.VSCode",
            name: "Visual Studio Code",
            sections: [
                {
                    title: "Format",
                    hotkeys: [
                        {
                            title: "Format Document",
                            key: "F",
                            modifiers: [Modifers.shift, Modifers.option]
                        }
                    ]
                }
            ]
        },
        {
            bundleId: "com.apple.Safari",
            name: "Safari",
            sections: [
                {
                    title: "Bookmarks",
                    hotkeys: [
                        {
                            title: "Open Bookmarks Manager",
                            key: "B",
                            modifiers: [Modifers.command, Modifers.option]
                        }
                    ]
                }
            ]
        }
    ]
}