import {Keymap} from "@/lib/model/internal/internal-models";

export const serializeKeymap = (keymap: Pick<Keymap, "title">) => {
    return keymap.title
        .replace(/[^\w-]+/g, "-")  // Replace non-word chars with dashes
        .replace(/^-+|-+$/g, "")    // Remove leading/trailing dashes
        .toLowerCase();
}

export const keymapMatchesTitle = (keymap: Keymap, title: string) => {
    return serializeKeymap(keymap) === title;
}
