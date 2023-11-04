import { AppShortcuts, Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import { validate } from "./validator";
import { AllApps } from '../model/input/input-models';

export async function createShortcutsProvider() {
    const data = await fetch('/combined-apps.json');
    const apps = await data.json() as AllApps;
    return new ShortcutsProvider(apps);
}

export class ShortcutsProvider {

    constructor(private readonly allApps: AllApps) {
    }

    public getShortcuts(): Shortcuts {
        validate(this.allApps.list);
        return {
            applications: parseInputShortcuts(this.allApps.list), // todo: don't parse each time
        };
    }

    public getShortcutsByApp(bundleId: string): AppShortcuts | undefined {
        const shortcuts = this.getShortcuts();
        return shortcuts.applications.find(app => app.bundleId === bundleId);
    }
}
