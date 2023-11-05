/**
 * Aggregation interface for all applications.
 */
export interface AllApps {
  list: InputApp[];
}

/**
 * High level type for each application.
 * Each application consist of name, bundleId and keymaps.
 * Bundle id is a unique identifier for the macOS application
 */
export interface InputApp {
  bundleId: string;
  name: string;
  keymaps: InputKeymap[];
}

/**
 * Application keymap. Keymap is shortcut configuration.
 * Most of the applications have single keymap that should be named "Default".
 * Each keymap consist of title and sections.
 */
export interface InputKeymap {
  title: string;
  sections: InputSection[];
}

/**
 * Section with shortcuts or category. Examples: Edit, Navigate, Format.
 * Each section consist of title and shortcuts.
 */
export interface InputSection {
  title: string;
  shortcuts: InputShortcut[];
}

/**
 * Shortcut with title and key.
 * Key consist of modifiers plus base key separated by '+' sign.
 * Supported modifiers: 'ctrl', 'shift', 'opt', 'cmd'. Modifiers should be specified in that exact order, lowercase @see {@link modifierTokens}.
 * Final shortcut token should always be a base key. List of all base keys: @see {@link keyCodes}.
 * Examples: 'ctrl+s', 'shift+cmd+e'.
 *
 * Shortcut macro or sequences of shortcuts are also supported and should be separated by whitespace (' ').
 * Example: 'cmd+k cmd+s'
 */
export interface InputShortcut {
  title: string;
  key: string;
}
