import { ShortcutsProvider } from "./shortcuts-provider";
import Validator from "./validator";
import { ShortcutsParser } from "./input-parser";
import { test } from "@jest/globals";
import {loadAllApps} from "@/lib/load/app-loader";
import {parseKeyCodes} from "../../../__tests__/helpers";

test("Parses all shortcuts successfully", async () => {
  const allApps = loadAllApps();
  const keyCodes = parseKeyCodes();

  const shortcutProvider = new ShortcutsProvider(allApps,
    new ShortcutsParser(),
    new Validator(keyCodes));
  shortcutProvider.getShortcuts();
});
