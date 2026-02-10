import {Metadata} from "next";
import {Header1, Paragraph, TypographyH3, TypographyInlineCode, TypographyLink} from "@/components/ui/typography";
import {createCanonical, createOpenGraph} from "@/lib/seo-utils";

export const metadata: Metadata = {
    title: "About Hotkys - Keyboard Shortcuts Database",
    description: "Hotkys is an open-source keyboard shortcuts database for macOS, Windows, and Linux applications. Learn how to contribute and improve your productivity.",
    alternates: createCanonical("/about"),
    openGraph: createOpenGraph(
        "/about",
        "About Hotkys - Keyboard Shortcuts Database",
        "Hotkys is an open-source keyboard shortcuts database for macOS, Windows, and Linux applications. Learn how to contribute and improve your productivity.",
    ),
};

export default function About() {
    const code = "\"$schema\": \"schema/shortcut.schema.json\"";
    return (
        <section className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
            <Header1>Hotkys</Header1>
            <Paragraph>Shortcuts database for different applications.</Paragraph>
            <Paragraph>
                Note: currently support only macOs. Please vote for this feature <TypographyLink
                href="https://github.com/solomkinmv/hotkys/issues/2">here</TypographyLink>
            </Paragraph>
            <TypographyH3 className="border-0">Contribution</TypographyH3>
            <Paragraph>
                Create PR with shortcuts in <TypographyInlineCode>shortcuts-data</TypographyInlineCode> on <TypographyLink
                href="https://github.com/solomkinmv/hotkys/tree/main/shortcuts-disco-site/shortcuts-data">GitHub</TypographyLink>.</Paragraph>
            <Paragraph>Include schema for each application <TypographyInlineCode>{code}</TypographyInlineCode> as a first JSON
                property.</Paragraph>
            <Paragraph>See full contribution guide on <TypographyLink href="https://github.com/solomkinmv/hotkys">GitHub</TypographyLink></Paragraph>
        </section>
    );
}
