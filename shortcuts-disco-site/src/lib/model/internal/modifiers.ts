export enum Modifiers {
    control = "control down",
    shift = "shift down",
    option = "option down",
    command = "command down",
    win = "win down",
}

// Detect platform (client-side only, cached for performance)
let cachedPlatform: 'windows' | 'linux' | 'macos' | null = null;

function getPlatform(): 'windows' | 'linux' | 'macos' {
    if (cachedPlatform) {
        return cachedPlatform;
    }

    if (typeof window === 'undefined') {
        return 'macos'; // Default to macOS for SSR
    }

    // Use userAgent instead of deprecated navigator.platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') > -1) {
        cachedPlatform = 'windows';
    } else if (userAgent.indexOf('linux') > -1) {
        cachedPlatform = 'linux';
    } else {
        cachedPlatform = 'macos';
    }

    return cachedPlatform;
}

// Lazy evaluation to avoid hydration mismatches
export const isWindows = typeof window !== 'undefined' && getPlatform() === 'windows';
export const isLinux = typeof window !== 'undefined' && getPlatform() === 'linux';

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
