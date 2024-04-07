import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header1, Paragraph } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Raycast Extension",
  description: "Shortcuts Disco is a tool to help you search keyboard shortcuts for applications",
  metadataBase: new URL("https://shortcuts.solomk.in"),
};

export default function Page() {
  return (
    <section className="prose prose-gray max-w-3xl mx-auto dark:prose-invert">
      <Header1>RayCast Extension: Shortcuts Search</Header1>
      <div className="flex flex-wrap justify-around">
        <div className="w-full sm:w-1/2 p-4">
          <Image alt="List of all aps in Raycast extension"
                 width={380} height={238} src="media/shortcuts-search-1.png"
                 className="mt-0 mb-0" />
        </div>
        <div className="w-full sm:w-1/2 p-4">
          <Image alt="App search in Raycast extension"
                 width={380} height={238} src="media/shortcuts-search-2.png"
                 className="mt-0 mb-0" />
        </div>
        <div className="w-full sm:w-1/2 p-4">
          <Image alt="Application specific shortcuts in Raycast extension"
                 width={380} height={238} src="media/shortcuts-search-3.png"
                 className="mt-0 mb-0" />
        </div>
        <div className="w-full sm:w-1/2 p-4">
          <Image alt="Shortcut sarch in Raycast extension"
                 width={380} height={238} src="media/shortcuts-search-4.png"
                 className="mt-0 mb-0" />
        </div>
      </div>
      <Paragraph><Link href="https://www.raycast.com" target="_blank">RayCast</Link> is a productivity tool,
        basically Spotlight on steroids.</Paragraph>
      <Paragraph>Allows to list, search and run shortcuts for different applications.</Paragraph>
      <Paragraph>By selecting shortcut extension actually runs the shortcut using AppleScript.</Paragraph>
      <Paragraph>You can download extension from the <Link
        href="https://www.raycast.com/solomkinmv/shortcuts-search" target="_blank">RayCast
        Store</Link>.</Paragraph>
      <Link title="Install shortcuts-search Raycast Extension"
            href="https://www.raycast.com/solomkinmv/shortcuts-search"
            target={"_blank"}
            style={{
              display: "flex",
              justifyContent: "center",
            }}>
        <Image
          src="https://www.raycast.com/solomkinmv/shortcuts-search/install_button@2x.png?v=1.1"
          alt="Install Shortcuts Disco Raycas extension" height={64} width={256}
        />
      </Link>
    </section>
  );
}
