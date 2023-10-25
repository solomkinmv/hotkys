import { Modifers } from "./modifiers"

export interface SectionHotkey {
    title: string,
    key: string
    modifiers: Modifers[]
  }
  
  interface Section {
    title: string,
    hotkeys: SectionHotkey[]
  }
  
  export interface Keymap {
    title: string,
    sections: Section[]
  }
  
  export interface AppHotkeys {
    bundleId: string,
    name: string,
    keymaps: Keymap[]
  }
  
  export interface Hotkeys {
    applications: AppHotkeys[]
  }