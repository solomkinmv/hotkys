import { Modifiers } from "./modifiers";

export interface Shortcuts {
  applications: Application[];
}

export interface Application {
  bundleId?: string;
  hostname?: string;
  name: string;
  slug: string;
  source?: string;
  icon?: string;
  customAppId?: string;
  keymaps: Keymap[];
}

export interface Keymap {
  title: string;
  platforms?: string[];
  sections: Section[];
}

export interface Section {
  title: string;
  hotkeys: SectionShortcut[];
}

export interface SectionShortcut {
  title: string;
  sequence: AtomicShortcut[];
  comment?: string;
  customizationStatus?: "changed" | "created";
  customizationId?: string;
  baseSectionTitle?: string;
  baseShortcutTitle?: string;
  baseShortcutId?: string;
}

export interface AtomicShortcut {
  base: string;
  modifiers: Modifiers[];
}
