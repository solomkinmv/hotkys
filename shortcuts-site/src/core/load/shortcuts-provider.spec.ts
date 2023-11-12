import {ShortcutsProvider} from "./shortcuts-provider";
import Validator from "./validator";
import {parseAllApps, parseKeyCodes} from "../../../__tests__/helpers.spec";
import {ShortcutsParser} from "./input-parser";

test("Parses all shortcuts successfully", async () => {
    const allApps = parseAllApps();
    const keyCodes = parseKeyCodes();

    const shortcutProvider = new ShortcutsProvider(allApps,
        new ShortcutsParser(keyCodes),
        new Validator(keyCodes));
    shortcutProvider.getShortcuts();
});
