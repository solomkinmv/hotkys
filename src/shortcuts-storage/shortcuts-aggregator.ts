import { Hotkeys } from "../model/models";
import { safariShortcuts } from "./apps/safari";
import { vsCodeShortcuts } from "./apps/vsCode";
import { xcodeShortcuts } from "./apps/xcode";

export const shortcutsStorage: Hotkeys = {
    applications: [
        safariShortcuts,
        vsCodeShortcuts,
        xcodeShortcuts
    ],
};
