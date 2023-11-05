export interface InputShortcut {
  title: string;
  key: string;
}

export interface InputSection {
  title: string;
  shortcuts: InputShortcut[];
}

export interface InputKeymap {
  title: string;
  sections: InputSection[];
}

export interface InputApp {
  bundleId: string;
  name: string;
  keymaps: InputKeymap[];
}

export interface AllApps {
  list: InputApp[];
}
