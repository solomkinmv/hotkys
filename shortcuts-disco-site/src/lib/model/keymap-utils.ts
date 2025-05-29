import {Keymap} from "@/lib/model/internal/internal-models";

export const serializeKeymap = (keymap: Keymap) => {
    const titlePart = keymap.title.replaceAll("\w", "-").toLowerCase();
    if (keymap.platform) {
        return `${titlePart}-${keymap.platform}`;
    }
    return titlePart;
}

export const keymapMatchesTitle = (keymap: Keymap, title: string) => {
    return serializeKeymap(keymap) === title;
}
