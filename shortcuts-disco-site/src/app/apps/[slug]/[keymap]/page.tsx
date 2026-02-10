import {getAllShortcuts, getAppShortcutsBySlug} from "@/lib/shortcuts";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {keymapMatchesTitle, serializeKeymap} from "@/lib/model/keymap-utils";
import {AppDetails} from "@/app/apps/[slug]/[keymap]/app-details";
import {AppShortcuts, Keymap} from "@/lib/model/internal/internal-models";
import {Suspense} from "react";
import Link from "next/link";
import {getPlatformDisplay} from "@/lib/utils";
import {generateKeymapDescription, createCanonical, createOpenGraph} from "@/lib/seo-utils";
import {getIconUrl} from "@/lib/utils/icon-helpers";

interface Props {
    params: Promise<{ slug: string, keymap: string }>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const app = getAppShortcutsBySlug(resolvedParams.slug);
    const appName = app?.name ?? "App";
    const keymap = app?.keymaps.find(km => keymapMatchesTitle(km, resolvedParams.keymap));
    const description = app && keymap
        ? generateKeymapDescription(app, keymap)
        : `Keyboard shortcuts cheat sheet for ${appName}`;
    const path = `/apps/${resolvedParams.slug}/${resolvedParams.keymap}`;

    return {
        title: `${appName} Shortcuts`,
        description,
        alternates: createCanonical(path),
        openGraph: createOpenGraph(path, `${appName} Shortcuts`, description),
        twitter: {
            card: "summary_large_image",
            title: `${appName} Shortcuts`,
            description,
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

    const iconUrl = appShortcuts.icon ? getIconUrl(appShortcuts.icon) : undefined;

    return (
        <>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight mx-auto max-w-5xl px-4 md:px-6 pt-4 md:pt-6 flex items-center gap-3">
                {iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={iconUrl}
                        alt=""
                        className="h-10 w-10 rounded-sm shrink-0"
                    />
                )}
                {appShortcuts.name}
                <span className="sr-only"> Keyboard Shortcuts</span>
            </h1>
            {appShortcuts.keymaps.length > 1 && (
                <nav className="sr-only" aria-label="Available keymaps">
                    {appShortcuts.keymaps.map(km => (
                        <Link
                            key={km.title}
                            href={`/apps/${appShortcuts.slug}/${serializeKeymap(km)}`}
                        >
                            {km.title} ({km.platforms?.map(getPlatformDisplay).join(', ')})
                        </Link>
                    ))}
                </nav>
            )}
            <Suspense>
                <AppDetails application={appShortcuts} keymap={keymap}/>
            </Suspense>
        </>
    );
}


const findKeymap = (app: AppShortcuts, serializedKeymapTitle: string): Keymap | undefined => {
    return app.keymaps.find(keymap => keymapMatchesTitle(keymap, serializedKeymapTitle));
}
