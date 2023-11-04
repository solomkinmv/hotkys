import { ShortcutsProvider } from './shortcuts-provider';

import * as fs from 'fs';
import * as path from 'path';
import { AllApps } from '../model/input/input-models';

test("Parses all shortcuts successfully", async () => {
    const filePath = path.resolve(__dirname, '../../../public', 'combined-apps.json');
    const jsonContents = fs.readFileSync(filePath, 'utf8');
    const allApps = JSON.parse(jsonContents) as AllApps;

    const shortcutProvider = new ShortcutsProvider(allApps);
    shortcutProvider.getShortcuts();
});
