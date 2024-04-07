import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Shortcuts Disco is a tool to help you search keyboard shortcuts for applications",
  metadataBase: new URL("https://shortcuts.solomk.in"),
};

export default function About() {
  const code = "\"$schema\": \"schema/shortcut.schema.json\"";
  return (
    <section className="prose prose-gray max-w-3xl mx-auto dark:prose-invert">
      <h1>Shortcuts Disco</h1>
      <p>Shortcuts database for different applications.</p>
      <p>
        Note: currently support only macOs. Please vote for this feature <Link
        href="https://github.com/solomkinmv/shortcuts-disco/issues/2" target="_blank">here</Link>
      </p>
      <h3>Contribution</h3>
      <p>
        Create PR with shortcuts in <kbd>shortcuts-data</kbd> on <Link
        href="https://github.com/solomkinmv/shortcuts-disco/tree/main/shortcuts-disco-site/shortcuts-data"
        target="_blank">GitHub</Link>.</p>
      <p>Include schema for each application <kbd>{code}</kbd> as a first JSON
        property.</p>
      <p>See full contribution guide on <Link href="https://github.com/solomkinmv/shortcuts-disco"
                                              target="_blank">GitHub</Link></p>
    </section>
  );
}
