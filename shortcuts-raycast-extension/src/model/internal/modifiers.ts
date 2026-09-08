export enum Modifiers {
  win = "win down",
  command = "command down",
  control = "control down",
  option = "option down",
  shift = "shift down",
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
  ["alt", Modifiers.option],
  ["cmd", Modifiers.command],
  ["win", Modifiers.win],
]);

export const modifierTokens: string[] = ["ctrl", "shift", "opt", "alt", "cmd"];
