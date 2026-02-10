import {ApplicationList} from "@/components/list/application-list";
import {getAllShortcuts} from "@/lib/shortcuts";
import {Metadata} from "next";
import {createCanonical, createOpenGraph} from "@/lib/seo-utils";

export const metadata: Metadata = {
    title: "Keyboard Shortcuts Cheat Sheets for Popular Apps",
    description: "Browse keyboard shortcuts for 60+ popular applications including Figma, VS Code, Slack, and more. Search and master shortcuts for macOS, Windows, and Linux.",
    alternates: createCanonical(""),
    openGraph: createOpenGraph(
        "",
        "Keyboard Shortcuts Cheat Sheets for Popular Apps",
        "Browse keyboard shortcuts for 60+ popular applications including Figma, VS Code, Slack, and more. Search and master shortcuts for macOS, Windows, and Linux.",
    ),
};

const AllApplicationsPage = () => {
    const allAppShortcuts = getAllShortcuts();
    return (
        <section className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
            <ApplicationList applications={allAppShortcuts.applications}/>
        </section>
    );
};

export default AllApplicationsPage;
