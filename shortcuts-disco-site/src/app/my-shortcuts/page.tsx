import { MyShortcutsContent } from "./my-shortcuts-content";
import { getAppSummaries } from "@/lib/shortcuts";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Shortcuts",
  robots: { index: false },
};

export default function MyShortcutsPage() {
  return (
    <Suspense>
      <MyShortcutsContent applications={getAppSummaries()} />
    </Suspense>
  );
}
