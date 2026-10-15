import { Platform } from "./internal-models";

export enum Modifiers {
  control = "control down",
  shift = "shift down",
  option = "option down",
  command = "command down",
  win = "win down",
}

// Detect platform (client-side only, cached for performance)
let cachedPlatform: Platform | null = null;

export function getPlatform(): Platform {
  if (cachedPlatform) {
    return cachedPlatform;
  }

  if (typeof window === "undefined") {
    return "macos"; // Default to macOS for SSR
  }

  // Use userAgent instead of deprecated navigator.platform
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf("win") > -1) {
    cachedPlatform = "windows";
  } else if (userAgent.indexOf("linux") > -1) {
    cachedPlatform = "linux";
  } else {
    cachedPlatform = "macos";
  }

  return cachedPlatform;
}

// macOS modifier symbols
export const macModifierSymbols: Map<Modifiers, string> = new Map([
  [Modifiers.command, "⌘"],
  [Modifiers.control, "⌃"],
  [Modifiers.option, "⌥"],
  [Modifiers.shift, "⇧"],
  [Modifiers.win, "⊞"],
]);

// Windows modifier symbols
export const winModifierSymbols: Map<Modifiers, string> = new Map([
  [Modifiers.command, "Ctrl"],
  [Modifiers.control, "Ctrl"],
  [Modifiers.option, "Alt"],
  [Modifiers.shift, "Shift"],
  [Modifiers.win, "Win"],
]);

// Linux modifier symbols (similar to Windows)
export const linuxModifierSymbols: Map<Modifiers, string> = new Map([
  [Modifiers.command, "Ctrl"],
  [Modifiers.control, "Ctrl"],
  [Modifiers.option, "Alt"],
  [Modifiers.shift, "Shift"],
  [Modifiers.win, "Super"],
]);

const macModifierNames: Map<Modifiers, string> = new Map([
  [Modifiers.command, "Command"],
  [Modifiers.control, "Control"],
  [Modifiers.option, "Option"],
  [Modifiers.shift, "Shift"],
  [Modifiers.win, "Windows"],
]);

const winModifierNames: Map<Modifiers, string> = new Map([
  [Modifiers.command, "Control"],
  [Modifiers.control, "Control"],
  [Modifiers.option, "Alt"],
  [Modifiers.shift, "Shift"],
  [Modifiers.win, "Windows"],
]);

const linuxModifierNames: Map<Modifiers, string> = new Map([
  ...winModifierNames,
  [Modifiers.win, "Super"],
]);

/**
 * Picks the platform whose modifier glyphs a keymap is written for.
 * Keymaps that include macOS (or declare no platform) use macOS glyphs.
 */
export function getKeymapDisplayPlatform(platforms?: Platform[]): Platform {
  if (!platforms?.length || platforms.includes("macos")) return "macos";
  if (platforms.includes("windows")) return "windows";
  return "linux";
}

export function getModifierSymbols(
  platforms?: Platform[],
): Map<Modifiers, string> {
  switch (getKeymapDisplayPlatform(platforms)) {
    case "windows":
      return winModifierSymbols;
    case "linux":
      return linuxModifierSymbols;
    case "macos":
      return macModifierSymbols;
  }
}

export function getModifierNames(
  platforms?: Platform[],
): Map<Modifiers, string> {
  switch (getKeymapDisplayPlatform(platforms)) {
    case "windows":
      return winModifierNames;
    case "linux":
      return linuxModifierNames;
    case "macos":
      return macModifierNames;
  }
}

export const modifierMapping: Map<string, Modifiers> = new Map([
  ["ctrl", Modifiers.control],
  ["shift", Modifiers.shift],
  ["opt", Modifiers.option],
  ["alt", Modifiers.option],
  ["cmd", Modifiers.command],
  ["win", Modifiers.win],
]);

export const modifierTokens: string[] = [
  "ctrl",
  "shift",
  "opt",
  "alt",
  "cmd",
  "win",
];

// Create a special order mapping that treats 'opt' and 'alt' as the same position
export const modifierTokensOrderMapping: Map<string, number> = new Map([
  ["ctrl", 0],
  ["shift", 1],
  ["opt", 2],
  ["alt", 2], // Same position as 'opt'
  ["cmd", 3],
  ["win", 4],
]);
