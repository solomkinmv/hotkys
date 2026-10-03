import { MyShortcutsContent } from "./my-shortcuts-content";
import { getAllShortcuts } from "@/lib/shortcuts";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Shortcuts",
};

export default function MyShortcutsPage() {
  return (
    <Suspense>
      <MyShortcutsContent applications={getAllShortcuts().applications} />
    </Suspense>
  );
}
