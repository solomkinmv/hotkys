import { safariShortcuts } from "./apps/safari";
import { vsCodeShortcuts } from "./apps/vsCode";
import { xcodeShortcuts } from "./apps/xcode";
import { InputApp } from "../model/input/input-models";

export const aggregatedApps: InputApp[] = [safariShortcuts, vsCodeShortcuts, xcodeShortcuts];
