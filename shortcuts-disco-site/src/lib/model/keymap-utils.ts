import {Keymap} from "@/lib/model/internal/internal-models";

export const serializeKeymap = (keymap: Keymap) => {
    return keymap.title.replaceAll("\w", "-").toLowerCase();
}

export const keymapMatchesTitle = (keymap: Keymap, title: string) => {
    return serializeKeymap(keymap) === title;
}
