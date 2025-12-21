import {getAllShortcuts, getAppShortcutsBySlug} from "@/lib/shortcuts";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {keymapMatchesTitle, serializeKeymap} from "@/lib/model/keymap-utils";
import {AppDetails} from "@/app/apps/[slug]/[keymap]/app-details";
import {AppShortcuts, Keymap} from "@/lib/model/internal/internal-models";
import {Suspense} from "react";

interface Props {
    params: Promise<{ slug: string, keymap: string }>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const app = getAppShortcutsBySlug(resolvedParams.slug);
    const appName = app?.name ?? "App";

    return {
        title: `${appName} Shortcuts`,
        description: `Keyboard shortcuts cheat sheet for ${appName}`,
        openGraph: {
            title: `${appName} Shortcuts`,
            description: `Keyboard shortcuts cheat sheet for ${appName}`,
        },
        twitter: {
            card: "summary_large_image",
            title: `${appName} Shortcuts`,
            description: `Keyboard shortcuts cheat sheet for ${appName}`,
        },
    };
}

export async function generateStaticParams() {
    return getAllShortcuts().applications
        .flatMap(app => app.keymaps.map(keymap => ({
            slug: app.slug,
            keymap: serializeKeymap(keymap)
        })));
}

export default async function SingleApplicationPage({params}: Props) {
    const resolvedParams = await params;
    const appShortcuts = getAppShortcutsBySlug(resolvedParams.slug) || notFound();
    const keymap = findKeymap(appShortcuts, resolvedParams.keymap) || notFound();

    return (
        <Suspense>
            <AppDetails application={appShortcuts} keymap={keymap}/>
        </Suspense>
    );
}


const findKeymap = (app: AppShortcuts, serializedKeymapTitle: string): Keymap | undefined => {
    return app.keymaps.find(keymap => keymapMatchesTitle(keymap, serializedKeymapTitle));
}
