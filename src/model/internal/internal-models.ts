import { Modifiers } from "./modifiers";

export interface SectionShortcut {
  title: string;
  sequence: AtomicShortcut[]
}

export interface AtomicShortcut {
  base: string;
  modifiers: Modifiers[];
}

export interface Section {
  title: string;
  hotkeys: SectionShortcut[];
}

export interface Keymap {
  title: string;
  sections: Section[];
}

export interface AppShortcuts {
  bundleId: string;
  name: string;
  keymaps: Keymap[];
}

export interface Shortcuts {
  applications: AppShortcuts[];
}
