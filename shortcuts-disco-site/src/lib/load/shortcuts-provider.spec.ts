import { ShortcutsProvider } from "./shortcuts-provider";
import Validator from "./validator";
import { ShortcutsParser } from "./input-parser";
import { test } from "@jest/globals";
import { parseAllApps, parseKeyCodes } from "../../../__tests__/helpers";

test("Parses all shortcuts successfully", async () => {
  const allApps = parseAllApps();
  const keyCodes = parseKeyCodes();

  const shortcutProvider = new ShortcutsProvider(allApps,
    new ShortcutsParser(),
    new Validator(keyCodes));
  shortcutProvider.getShortcuts();
});
