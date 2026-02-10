import {AppShortcuts, Keymap} from "@/lib/model/internal/internal-models";
import {getPlatformDisplay} from "@/lib/utils";
import {Metadata} from "next";

const SITE_URL = "https://hotkys.com";
const SITE_NAME = "Hotkys";

export function generateKeymapDescription(app: AppShortcuts, keymap: Keymap): string {
    const platforms = keymap.platforms?.map(getPlatformDisplay).filter(Boolean).join("/") ?? "keyboard";
    const totalShortcuts = keymap.sections.reduce((sum, s) => sum + s.hotkeys.length, 0);
    const sectionNames = keymap.sections.slice(0, 3).map(s => s.title).join(", ");
    const sectionSuffix = keymap.sections.length > 3 ? ", and more" : "";

    return `Complete ${platforms} keyboard shortcuts for ${app.name}. Master ${totalShortcuts} shortcuts across ${keymap.sections.length} categories including ${sectionNames}${sectionSuffix}.`;
}

export function createCanonical(path: string): Metadata["alternates"] {
    return {
        canonical: `${SITE_URL}${path}`,
    };
}

export function createOpenGraph(path: string, title: string, description: string): Metadata["openGraph"] {
    return {
        type: "website",
        url: `${SITE_URL}${path}`,
        siteName: SITE_NAME,
        title,
        description,
    };
}
