import { AppShortcuts, Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import { aggregatedApps } from "../shortcuts-db/shortcuts-aggregator";
import { validate } from "./validator";
import { useState } from "react";

export function useShortcutsProvider() {
    const [instance] = useState(new ShortcutsProvider());
    return instance;
}

export class ShortcutsProvider {
    public getShortcuts(): Shortcuts {
        validate(aggregatedApps);
        return {
            applications: parseInputShortcuts(aggregatedApps), // todo: don't parse each time
        };
    }

    public getShortcutsByApp(bundleId: string): AppShortcuts | undefined {
        const shortcuts = this.getShortcuts();
        return shortcuts.applications.find(app => app.bundleId === bundleId);
    }
}
