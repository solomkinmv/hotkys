import { runAppleScript, showFailureToast } from "@raycast/utils";
import { Modifers } from "../model/modifiers";
import { keyCodes } from "../model/key-codes";

const appleScript = `
function run(argv) {
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;

  const targetBundleID = argv[0];

  // Activate the target application
  const systemEvents = Application('System Events');
  if (systemEvents.applicationProcesses.whose({ bundleIdentifier: targetBundleID }).length > 0) {
      app.doShellScript("open -b " + targetBundleID);
      delay(parseFloat(argv[1])); // Adjust the delay as needed for the app to activate
  }

  // Trigger the shortcut
  const modifiers = [];
  const modifiersStartIndex = 3;
  for (var i = 0; i <= 4; i++) {
    if (argv[modifiersStartIndex + i] !== undefined) {
      modifiers.push(argv[modifiersStartIndex + i]);
    }
  }
  systemEvents.keyCode(parseInt(argv[2]), {
      using: modifiers
  })
}
`;

export async function runShortcuts(bundleId: string, delay: number, key: string, modifiers: Modifers[]) {
  console.log(`Running shortcut for application ${bundleId} with delay ${delay}`);
  try {
    await runAppleScript(appleScript,
      [bundleId, String(delay), keyCodes.get(key)!, ...modifiers],
      {
        language: "JavaScript",
      },
    );
  } catch (error) {
    showFailureToast(error, { title: "Couldn't run shortcut" });
    return;
  }
}