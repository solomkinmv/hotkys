import {getAllShortcuts} from "@/lib/shortcuts";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {AppDetails} from "@/app/apps/[slug]/app-details";

interface Props {
    params: { slug: string };
}

export function generateMetadata({params}: Props): Metadata {
    return {
        title: findApplication(params.slug)?.name,
    };
}

export async function generateStaticParams() {
    return getAllShortcuts().applications
        .map(app => ({slug: app.slug}));
}

export default function SingleApplicationPage({params}: Props) {
    const appShortcuts = findApplication(params.slug) || notFound();


    return (
        <>
            <AppDetails application={appShortcuts}/>
        </>
    );
}

function findApplication(slug: string) {
    return getAllShortcuts()
        .applications
        .find(app => app.slug === slug);
}
