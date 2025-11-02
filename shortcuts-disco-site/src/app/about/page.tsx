import {Metadata} from "next";
import {Header1, Paragraph, TypographyLink} from "@/components/ui/typography";

export const metadata: Metadata = {
    title: "About",
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
            <h3>Contribution</h3>
            <Paragraph>
                Create PR with shortcuts in <kbd>shortcuts-data</kbd> on <TypographyLink
                href="https://github.com/solomkinmv/hotkys/tree/main/shortcuts-disco-site/shortcuts-data">GitHub</TypographyLink>.</Paragraph>
            <Paragraph>Include schema for each application <kbd>{code}</kbd> as a first JSON
                property.</Paragraph>
            <Paragraph>See full contribution guide on <TypographyLink href="https://github.com/solomkinmv/hotkys">GitHub</TypographyLink></Paragraph>
        </section>
    );
}
