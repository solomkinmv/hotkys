import { runAppleScript } from "@raycast/utils";
import { Modifers } from "../model/modifiers";
import { keyCodes } from "../model/key-codes";

export async function runShortcuts(bundleId: string, key: string, modifiers: Modifers[]) {
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
        language: "JavaScript",
      },
    );
  }