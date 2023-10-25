export enum Modifers {
    command = "command down",
    control = "control down",
    option = "option down",
    shift = "shift down"
}

export const modifierSymbols: Map<Modifers, string> = new Map([
    [Modifers.command, "⌘"],
    [Modifers.control, "^"],
    [Modifers.option, "⌥"],
    [Modifers.shift, "⇧"]
])