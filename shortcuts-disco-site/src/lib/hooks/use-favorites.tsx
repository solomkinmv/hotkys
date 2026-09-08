"use client";
import { useState, type ReactNode } from "react";
import { useAccountData } from "@/components/auth/account-data-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { matchesFavorite, type FavoriteIdentifier } from "@/lib/shortcut-core/favorites";
export function FavoritesProvider({ children }: { children: ReactNode }) { return children; }
export function useFavorites() {
  const account = useAccountData();
  const { user } = useAuth();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const favorites = account.data.favorites;
  return { favorites, isLoading: account.loading, error: account.errors.favorites, refetch: account.refetch, pending, removeFavorite: account.removeFavorite,
    isFavorite: (identifier: FavoriteIdentifier) => favorites.some(row => matchesFavorite(row, identifier)),
    toggleFavorite: async (identifier: FavoriteIdentifier) => {
      if (!user) return;
      const key = JSON.stringify(identifier);
      if (pending.has(key)) return;
      setPending(previous => new Set(previous).add(key));
      try {
        const existing = favorites.find(row => matchesFavorite(row, identifier));
        if (existing) await account.removeFavorite(existing.id);
        else await account.addFavorite(identifier);
      } finally { setPending(previous => { const next = new Set(previous); next.delete(key); return next; }); }
    },
  };
}
