import { ActionPanel, Detail, List, Action, getFrontmostApplication } from "@raycast/api";
import { showHUD } from "@raycast/api";
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
  const appHotkeys: AppHotkeys = hotkeys.applications[0];
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

