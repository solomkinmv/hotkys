import {getAllShortcuts, getAppShortcutsBySlug} from "@/lib/shortcuts";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {AppDetails} from "@/app/apps/[slug]/[keymap]/app-details";

interface Props {
    params: { slug: string };
}

export function generateMetadata({params}: Props): Metadata {
    return {
        title: getAppShortcutsBySlug(params.slug)?.name,
    };
}

export async function generateStaticParams() {
    return getAllShortcuts().applications
        .flatMap(app => ({slug: app.slug}));
}

export default function SingleApplicationPage({params}: Props) {
    const appShortcuts = getAppShortcutsBySlug(params.slug) || notFound();

    return (
        <section className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
            <AppDetails application={appShortcuts} keymap={appShortcuts.keymaps[0]}/>
        </section>
    );
}
