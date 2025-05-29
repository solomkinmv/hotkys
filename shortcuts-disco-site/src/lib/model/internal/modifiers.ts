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
    ["cmd", isWindows || isLinux ? Modifiers.control : Modifiers.command],
    ["win", Modifiers.win],
]);

export const modifierTokens: string[] = ["ctrl", "shift", "opt", "cmd", "win"];

export const modifierTokensOrderMapping: Map<string, number> = new Map();
modifierTokens.forEach((key, index) => {
    modifierTokensOrderMapping.set(key, index);
});
