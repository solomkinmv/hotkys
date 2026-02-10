import {Metadata} from "next";
import Image from "next/image";
import {Header1, Paragraph, TypographyLink} from "@/components/ui/typography";
import {createCanonical, createOpenGraph} from "@/lib/seo-utils";

export const metadata: Metadata = {
    title: "Raycast Extension - Search and Run Shortcuts",
    description: "Download the Hotkys Raycast extension to search, browse, and execute keyboard shortcuts directly from Raycast for any application.",
    alternates: createCanonical("/raycast-extension"),
    openGraph: createOpenGraph(
        "/raycast-extension",
        "Raycast Extension - Search and Run Shortcuts",
        "Download the Hotkys Raycast extension to search, browse, and execute keyboard shortcuts directly from Raycast for any application.",
    ),
};

export default function Page() {
    return (
        <section className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
            <Header1>RayCast Extension: Shortcuts Search</Header1>
            <div className="flex flex-wrap justify-around">
                <div className="w-full p-4 sm:w-1/2">
                    <Image alt="List of all aps in Raycast extension"
                           width={380} height={238} src="media/shortcuts-search-1.webp"
                           className="mt-0 mb-0"/>
                </div>
                <div className="w-full p-4 sm:w-1/2">
                    <Image alt="App search in Raycast extension"
                           width={380} height={238} src="media/shortcuts-search-2.webp"
                           className="mt-0 mb-0"/>
                </div>
                <div className="w-full p-4 sm:w-1/2">
                    <Image alt="Application specific shortcuts in Raycast extension"
                           width={380} height={238} src="media/shortcuts-search-3.webp"
                           className="mt-0 mb-0"/>
                </div>
                <div className="w-full p-4 sm:w-1/2">
                    <Image alt="Shortcut search in Raycast extension"
                           width={380} height={238} src="media/shortcuts-search-4.webp"
                           className="mt-0 mb-0"/>
                </div>
            </div>
            <Paragraph><TypographyLink href="https://www.raycast.com">RayCast</TypographyLink> is a productivity tool,
                basically Spotlight on steroids.</Paragraph>
            <Paragraph>Allows to list, search and run shortcuts for different applications.</Paragraph>
            <Paragraph>By selecting shortcut extension actually runs the shortcut using AppleScript.</Paragraph>
            <Paragraph>You can download extension from the <TypographyLink
                href="https://www.raycast.com/solomkinmv/shortcuts-search">RayCast
                Store</TypographyLink>.</Paragraph>
            <a title="Install shortcuts-search Raycast Extension"
               href="https://www.raycast.com/solomkinmv/shortcuts-search"
               target="_blank"
               style={{
                   display: "flex",
                   justifyContent: "center",
               }}
               rel="noopener noreferrer nofollow">
                <Image
                    src="https://www.raycast.com/solomkinmv/shortcuts-search/install_button@2x.png?v=1.1"
                    alt="Install Hotkys Raycast extension" height={64} width={256}
                />
            </a>
        </section>
    );
}
