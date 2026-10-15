import fs from "fs";
import path from "path";
import { ShortcutsParser } from "@/lib/load/input-parser";
import Validator from "@/lib/load/validator";
import { ShortcutsProvider } from "@/lib/load/shortcuts-provider";
import { AllApps } from "@/lib/model/input/input-models";
import { AppShortcuts } from "@/lib/model/internal/internal-models";
import { AppSummary, summarizeApps } from "@/lib/model/internal/app-summary";

const shortcutsDirectory = path.join(process.cwd(), "public/data");

export function getAllShortcuts() {
  const keyCodes = JSON.parse(
    fs.readFileSync(path.join(shortcutsDirectory, "key-codes.json"), "utf-8"),
  ) as {
    keyCodes: [string, string][];
  };
  const combinedAppsContents = JSON.parse(
    fs.readFileSync(
      path.join(shortcutsDirectory, "combined-apps.json"),
      "utf8",
    ),
  ) as AllApps;

  return new ShortcutsProvider(
    combinedAppsContents,
    new ShortcutsParser(),
    new Validator(new Map(keyCodes.keyCodes)),
  ).getShortcuts();
}

export function getAppShortcutsBySlug(slug: string): AppShortcuts | undefined {
  return getAllShortcuts().applications.find((app) => app.slug === slug);
}

/** Catalog apps without their shortcuts, for client lists that only need metadata and counts. */
export function getAppSummaries(): AppSummary[] {
  return summarizeApps(getAllShortcuts().applications);
}
