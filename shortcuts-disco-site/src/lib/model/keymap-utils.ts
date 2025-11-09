import {Keymap} from "@/lib/model/internal/internal-models";

export const serializeKeymap = (keymap: Keymap) => {
    const titlePart = keymap.title
        .replace(/[^\w-]+/g, "-")  // Replace non-word chars with dashes
        .replace(/^-+|-+$/g, "")    // Remove leading/trailing dashes
        .toLowerCase();
    return titlePart;
}

export const keymapMatchesTitle = (keymap: Keymap, title: string) => {
    return serializeKeymap(keymap) === title;
}
