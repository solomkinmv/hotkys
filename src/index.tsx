import { ActionPanel, Detail, List, Action, getFrontmostApplication } from "@raycast/api";
import { showHUD } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";


async function runAS() {
  const res = await runAppleScript(
    `
    tell application "System Events"
      key code 0 using {command down}
    end tell
    `
  );
  await showHUD(res);
}

async function runAS2() {
  runAppleScript(
    `
    set targetBundleID to "com.microsoft.VSCode" -- Replace with the desired bundle identifier

    -- Activate the target application
    tell application "System Events"
      if (bundle identifier of every application process) contains targetBundleID then
        do shell script "open -b " & targetBundleID
        delay 1 -- Adjust the delay as needed for the app to activate
      end if
    end tell

    -- Trigger the "Cmd" + "A" shortcut
    tell application "System Events"
      key code 0 using {command down}
    end tell

    `
  )

  await showHUD("done");
}

async function runAS3() {
  const frontmostApplication = await getFrontmostApplication();
  runAppleScript(
    `
    on run argv
      set targetBundleID to item 1 of argv

      -- Activate the target application
      tell application "System Events"
        if (bundle identifier of every application process) contains targetBundleID then
          do shell script "open -b " & targetBundleID
          delay 1 -- Adjust the delay as needed for the app to activate
        end if
      end tell

      -- Trigger the "Cmd" + "A" shortcut
      tell application "System Events"
        key code 0 using {command down}
      end tell
    end run
    `,
    [frontmostApplication.bundleId!]
  )

  console.log(`The frontmost application is: ${frontmostApplication.name}`);
  await showHUD(frontmostApplication.bundleId!);
}

async function runAS4() {
  const frontmostApplication = await getFrontmostApplication();
  runAppleScript(
    `
    on run argv
      set targetBundleID to item 1 of argv
      set shortcutModifier to item 2 of argv
      set characterToType to item 3 of argv

      -- Convert the shortcut modifier to the appropriate key code
      set modifierKeyCode to 0
      if shortcutModifier is "Cmd" then
        set modifierKeyCode to 55 -- Command key
      else if shortcutModifier is "Ctrl" then
        set modifierKeyCode to 59 -- Control key
      else if shortcutModifier is "Option" then
        set modifierKeyCode to 58 -- Option key
      else if shortcutModifier is "Shift" then
        set modifierKeyCode to 56 -- Shift key
      end if

      -- Activate the target application
      tell application "System Events"
        if (bundle identifier of every application process) contains targetBundleID then
          do shell script "open -b " & targetBundleID
          delay 1 -- Adjust the delay as needed for the app to activate
        end if
      end tell

      -- Trigger the shortcut with the specified modifier
      tell application "System Events"
        key code modifierKeyCode using {command down}
        delay 0.5 -- Adjust the delay as needed
        keystroke characterToType
      end tell
    end run

    `,
    [frontmostApplication.bundleId!, "Cmd", "A"]
  )

  console.log(`The frontmost application is: ${frontmostApplication.name}`);
  await showHUD(frontmostApplication.bundleId!);
}

async function runAS5() {
  const frontmostApplication = await getFrontmostApplication();
  runAppleScript(
    `
    on run argv
      set targetBundleID to item 1 of argv
      set symbol to item 2 of argv
      set modifierAction to item 3 of argv

      -- Activate the target application
      tell application "System Events"
        if (bundle identifier of every application process) contains targetBundleID then
          do shell script "open -b " & targetBundleID
          delay 1 -- Adjust the delay as needed for the app to activate
        end if
      end tell

      -- Trigger the "Cmd" + "A" shortcut
      tell application "System Events"
        key code symbol using {modifierAction}
      end tell
    end run
    `,
    [frontmostApplication.bundleId!, "0", "55"]
  )

  console.log(`v5: The frontmost application is: ${frontmostApplication.bundleId!}`);
  await showHUD(frontmostApplication.bundleId!);
}

async function runAS6() {
  const frontmostApplication = await getFrontmostApplication();
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
    [frontmostApplication.bundleId!, keyCodes.get("tilde")!, Modifers.control, Modifers.shift],
    {
      language: "JavaScript"
    }
  )

  console.log(`v6: The frontmost application is: ${frontmostApplication.bundleId!}`);
  await showHUD(frontmostApplication.bundleId!);
}

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

async function runAS7() {
  const frontmostApplication = await getFrontmostApplication();
  triggerHotkey(frontmostApplication.bundleId!, "A", [Modifers.command])

  console.log(`v7: The frontmost application is: ${frontmostApplication.bundleId!}`);
  await showHUD(frontmostApplication.bundleId!);
}

async function hudFrontApp() {
  const frontmostApplication = await getFrontmostApplication();
  console.log(`The frontmost application is: ${frontmostApplication.name}`);
  await showHUD(JSON.stringify(frontmostApplication));
}

export default function Command() {
  return (
    <List>
      <List.Item
        icon="list-icon.png"
        title="Greeting"
        actions={
          <ActionPanel>
            <Action title="Show Details" onAction={() => runAS7()}/>
          </ActionPanel>
        }
      />
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
      bundleId: "com.appl.dt.Xcode",
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
    }
  ]
}