import { AboutContent } from "@/app/about/about-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: 'Shortcuts Disco is a tool to help you search keyboard shortcuts for applications',
  metadataBase: new URL('https://shortcuts.solomk.in'),
};

export default function About() {
  const code = "\"$schema\": \"schema/shortcut.schema.json\"";
  return (
    <AboutContent />
  );
}
