export enum Modifiers {
    control = "control down",
    shift = "shift down",
    option = "option down",
    command = "command down",
}

export const modifierSymbols: Map<Modifiers, string> = new Map([
    [Modifiers.command, "⌘"],
    [Modifiers.control, "⌃"],
    [Modifiers.option, "⌥"],
    [Modifiers.shift, "⇧"],
]);

export const modifierMapping: Map<string, Modifiers> = new Map([
    ["ctrl", Modifiers.control],
    ["shift", Modifiers.shift],
    ["opt", Modifiers.option],
    ["cmd", Modifiers.command],
]);

export const modifierTokens: string[] = ["ctrl", "shift", "opt", "cmd"];

export const modifierTokensOrderMapping: Map<string, number> = new Map();
modifierTokens.forEach((key, index) => {
    modifierTokensOrderMapping.set(key, index);
});
