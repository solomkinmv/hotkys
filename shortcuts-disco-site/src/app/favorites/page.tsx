import { getAllShortcuts } from "@/lib/shortcuts";
import { FavoritesContent } from "./favorites-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
};

export default function FavoritesPage() {
  return <FavoritesContent publicApps={getAllShortcuts().applications.map(app => ({ slug: app.slug, keymapTitles: app.keymaps.map(keymap => keymap.title) }))} />;
}
