export enum Modifiers {
  command = "command down",
  control = "control down",
  option = "option down",
  shift = "shift down",
}

export const modifierSymbols: Map<Modifiers, string> = new Map([
  [Modifiers.command, "⌘"],
  [Modifiers.control, "^"],
  [Modifiers.option, "⌥"],
  [Modifiers.shift, "⇧"],
]);
