import { FavoritesContent } from "./favorites-content";
import { getAllShortcuts } from "@/lib/shortcuts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false },
};

export default function FavoritesPage() {
  return <FavoritesContent applications={getAllShortcuts().applications} />;
}
