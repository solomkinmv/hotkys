import { AuthUnavailableGate } from "@/components/auth/auth-unavailable";
import { FavoritesContent } from "./favorites-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <AuthUnavailableGate>
      <FavoritesContent />
    </AuthUnavailableGate>
  );
}
