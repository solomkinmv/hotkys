import { safariShortcuts } from "./apps/safari";
import { vsCodeShortcuts } from "./apps/vsCode";
import { xcodeShortcuts } from "./apps/xcode";
import { InputApp } from "../model/input/input-models";
import { intellijIdeaEapShortcuts, intellijIdeaShortcuts } from "./apps/intellij-idea";
import { macOsShortcuts } from "./apps/macos";

export const aggregatedApps: InputApp[] = [
    intellijIdeaEapShortcuts,
    intellijIdeaShortcuts,
    macOsShortcuts,
    safariShortcuts,
    vsCodeShortcuts,
    xcodeShortcuts,
];
