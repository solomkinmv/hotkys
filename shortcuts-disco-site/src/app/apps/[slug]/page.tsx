import {getAllShortcuts, getAppShortcutsBySlug} from "@/lib/shortcuts";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {PlatformAwareAppDetails} from "@/app/apps/[slug]/platform-aware-app-details";
import {Suspense} from "react";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const resolvedParams = await params;
    return {
        title: getAppShortcutsBySlug(resolvedParams.slug)?.name + " Shortcuts",
        description: "Keyboard shortcuts for " + getAppShortcutsBySlug(resolvedParams.slug)?.name,
    };
}

export async function generateStaticParams() {
    return getAllShortcuts().applications
        .flatMap(app => ({slug: app.slug}));
}

export default async function SingleApplicationPage({params}: Props) {
    const resolvedParams = await params;
    const appShortcuts = getAppShortcutsBySlug(resolvedParams.slug) || notFound();

    return (
        <Suspense>
            <PlatformAwareAppDetails application={appShortcuts}/>
        </Suspense>
    );
}
