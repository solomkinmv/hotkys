import {AppShortcuts, Shortcuts} from "../model/internal/internal-models";
import {ShortcutsParser} from "./input-parser";
import Validator from "./validator";
import {AllApps} from "../model/input/input-models";

export async function createShortcutsProvider() {
    const data = await fetch("/data/combined-apps.json");
    const apps = await data.json() as AllApps;

    const keyCodesData = await fetch("/data/key-codes.json");
    const keyCodePairs = await keyCodesData.json() as { keyCodes: [string, string][] };

    const keyCodesMap = new Map(keyCodePairs.keyCodes);
    return new ShortcutsProvider(apps,
        new ShortcutsParser(keyCodesMap),
        new Validator(keyCodesMap)); // todo: don't create these classes each time
}

export class ShortcutsProvider {
    constructor(
        private readonly allApps: AllApps,
        private readonly parser: ShortcutsParser,
        private readonly validator: Validator,
    ) {
    }

    public getShortcuts(): Shortcuts {
        this.validator.validate(this.allApps.list);
        return {
            applications: this.parser.parseInputShortcuts(this.allApps.list),
        };
    }

    public getShortcutsByApp(bundleId: string): AppShortcuts | undefined {
        const shortcuts = this.getShortcuts();
        return shortcuts.applications.find((app) => app.bundleId === bundleId);
    }
}
