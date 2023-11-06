import { AppShortcuts, Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import Validator from "./validator";
import { AllApps } from '../model/input/input-models';

export async function createShortcutsProvider() {
    const data = await fetch('/combined-apps.json');
    const apps = await data.json() as AllApps;

    const keyCodesData = await fetch('/key-codes.json');
    const keyCodePairs = await keyCodesData.json() as { keyCodes: [string, string][] };

    return new ShortcutsProvider(apps, new Validator(new Map(keyCodePairs.keyCodes))); // todo: don't create these classes each time
}

export class ShortcutsProvider {

    constructor(private readonly allApps: AllApps,
                private readonly validator: Validator) {
    }

    public getShortcuts(): Shortcuts {
        this.validator.validate(this.allApps.list);
        return {
            applications: parseInputShortcuts(this.allApps.list), // todo: don't parse each time
        };
    }

    public getShortcutsByApp(bundleId: string): AppShortcuts | undefined {
        const shortcuts = this.getShortcuts();
        return shortcuts.applications.find(app => app.bundleId === bundleId);
    }
}
