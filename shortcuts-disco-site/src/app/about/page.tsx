import {Metadata} from "next";
import Link from "next/link";
import {Header1, Paragraph} from "@/components/ui/typography";

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
                Note: currently support only macOs. Please vote for this feature <Link
                href="https://github.com/solomkinmv/hotkys/issues/2" target="_blank">here</Link>
            </Paragraph>
            <h3>Contribution</h3>
            <Paragraph>
                Create PR with shortcuts in <kbd>shortcuts-data</kbd> on <Link
                href="https://github.com/solomkinmv/hotkys/tree/main/shortcuts-disco-site/shortcuts-data"
                target="_blank">GitHub</Link>.</Paragraph>
            <Paragraph>Include schema for each application <kbd>{code}</kbd> as a first JSON
                property.</Paragraph>
            <Paragraph>See full contribution guide on <Link href="https://github.com/solomkinmv/hotkys"
                                                            target="_blank">GitHub</Link></Paragraph>
        </section>
    );
}
