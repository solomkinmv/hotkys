import { safariShortcuts } from "./apps/safari";
import { vsCodeShortcuts } from "./apps/vsCode";
import { xcodeShortcuts } from "./apps/xcode";
import { InputApp } from "../model/input/input-models";
import { intellijIdeaEapShortcuts, intellijIdeaShortcuts } from "./apps/intellij-idea";

export const aggregatedApps: InputApp[] = [
  intellijIdeaEapShortcuts,
  intellijIdeaShortcuts,
  safariShortcuts,
  vsCodeShortcuts,
  xcodeShortcuts,
];
