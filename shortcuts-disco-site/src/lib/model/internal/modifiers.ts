export enum Modifiers {
    control = "control down",
    shift = "shift down",
    option = "option down",
    command = "command down",
    win = "win down",
}

// Detect platform
export const isWindows = typeof window !== 'undefined' && navigator.platform.indexOf('Win') > -1;
export const isLinux = typeof window !== 'undefined' && navigator.platform.indexOf('Linux') > -1;

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

// Use the appropriate modifier symbols based on platform
export const modifierSymbols: Map<Modifiers, string> = 
    isWindows ? winModifierSymbols : 
    isLinux ? linuxModifierSymbols : 
    macModifierSymbols;

export const modifierMapping: Map<string, Modifiers> = new Map([
    ["ctrl", Modifiers.control],
    ["shift", Modifiers.shift],
    ["opt", Modifiers.option],
    ["alt", Modifiers.option],
    ["cmd", isWindows || isLinux ? Modifiers.control : Modifiers.command],
    ["win", Modifiers.win],
]);

export const modifierTokens: string[] = ["ctrl", "shift", "opt", "alt", "cmd", "win"];

// Create a special order mapping that treats 'opt' and 'alt' as the same position
export const modifierTokensOrderMapping: Map<string, number> = new Map([
    ["ctrl", 0],
    ["shift", 1],
    ["opt", 2],
    ["alt", 2],  // Same position as 'opt'
    ["cmd", 3],
    ["win", 4],
]);
