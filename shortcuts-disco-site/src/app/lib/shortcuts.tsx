import fs from "fs";
import path from "path";
import { ShortcutsParser } from "@/app/lib/core/load/input-parser";
import Validator from "@/app/lib/core/load/validator";
import { ShortcutsProvider } from "@/app/lib/core/load/shortcuts-provider";
import { AllApps } from "@/app/lib/core/model/input/input-models";

const shortcutsDirectory = path.join(process.cwd(), "public/data");

export function getAllShortcuts() {
  const keyCodes = JSON.parse(fs.readFileSync(path.join(shortcutsDirectory, "key-codes.json"), "utf-8")) as {
    keyCodes: [string, string][]
  };
  const combinedAppsContents = JSON.parse(fs.readFileSync(path.join(shortcutsDirectory, "combined-apps.json"), "utf8")) as AllApps;

  return new ShortcutsProvider(combinedAppsContents,
    new ShortcutsParser(),
    new Validator(new Map(keyCodes.keyCodes))).getShortcuts();
}
