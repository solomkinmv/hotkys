import {getAllShortcuts} from "@/lib/shortcuts";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {keymapMatchesTitle, serializeKeymap} from "@/lib/model/keymap-utils";
import {AppDetails} from "@/app/apps/[slug]/[keymap]/app-details";
import {AppShortcuts, Keymap} from "@/lib/model/internal/internal-models";

interface Props {
    params: { slug: string, keymap: string };
}

export function generateMetadata({params}: Props): Metadata {
    return {
        title: findApplication(params.slug)?.name,
    };
}

export async function generateStaticParams() {
    return getAllShortcuts().applications
        .flatMap(app => app.keymaps.map(keymap => ({
            slug: app.slug,
            keymap: serializeKeymap(keymap)
        })));
}

export default function SingleApplicationPage({params}: Props) {
    const appShortcuts = findApplication(params.slug) || notFound();
    const keymap = findKeymap(appShortcuts, params.keymap) || notFound();

    return (
        <section className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
            <AppDetails application={appShortcuts} keymap={keymap}/>
        </section>
    );
}

function findApplication(slug: string): AppShortcuts | undefined {
    return getAllShortcuts()
        .applications
        .find(app => app.slug === slug);
}

const findKeymap = (app: AppShortcuts, serializedKeymapTitle: string): Keymap | undefined => {
    return app.keymaps.find(keymap => keymapMatchesTitle(keymap, serializedKeymapTitle));
}
