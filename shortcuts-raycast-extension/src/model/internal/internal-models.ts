import { Modifiers } from "./modifiers";

export interface SectionShortcut {
  title: string;
  sequence: AtomicShortcut[];
  runnable: boolean;
}

export interface AtomicShortcut {
  base: string;
  modifiers: Modifiers[];
  runnable: boolean;
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
