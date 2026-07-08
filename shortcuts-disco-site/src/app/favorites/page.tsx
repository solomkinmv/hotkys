import { FavoritesContent } from "./favorites-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
};

export default function FavoritesPage() {
  return <FavoritesContent />;
}
