import {redirect} from "next/navigation";
import {getAllShortcuts, getAppShortcutsBySlug} from "@/lib/shortcuts";
import {notFound} from "next/navigation";
import {serializeKeymap} from "@/lib/model/keymap-utils";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return getAllShortcuts().applications
        .map(app => ({slug: app.slug}));
}

export default async function SlugPage({params}: Props) {
    const {slug} = await params;
    const app = getAppShortcutsBySlug(slug) ?? notFound();
    const defaultKeymap = app.keymaps[0];
    if (!defaultKeymap) {
        notFound();
    }
    redirect(`/apps/${slug}/${serializeKeymap(defaultKeymap)}`);
}
