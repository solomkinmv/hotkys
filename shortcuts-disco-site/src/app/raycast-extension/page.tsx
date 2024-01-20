import RaycastExtensionContent from "@/app/raycast-extension/raycast-extension";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raycast Extension",
  description: "Shortcuts Disco is a tool to help you search keyboard shortcuts for applications",
  metadataBase: new URL("https://shortcuts.solomk.in"),
};

export default function Page() {
  return <RaycastExtensionContent />;
}
