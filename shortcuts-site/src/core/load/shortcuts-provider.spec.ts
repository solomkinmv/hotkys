import { ShortcutsProvider } from './shortcuts-provider';
import Validator from './validator';
import { parseAllApps, parseKeyCodes } from './helpers.spec';

test("Parses all shortcuts successfully", async () => {
    const allApps = parseAllApps();
    const keyCodes = parseKeyCodes();

    const shortcutProvider = new ShortcutsProvider(allApps, new Validator(keyCodes));
    shortcutProvider.getShortcuts();
});
