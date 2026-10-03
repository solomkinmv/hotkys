"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useAccountData } from "@/components/auth/account-data-provider";
import { useAuth } from "@/components/auth/auth-provider";
import {
  matchesFavorite,
  type FavoriteIdentifier,
} from "@/lib/shortcut-core/favorites";
export function FavoritesProvider({ children }: { children: ReactNode }) {
  return children;
}
export function useFavorites() {
  const account = useAccountData();
  const { refreshAfterWrite } = account;
  const { user } = useAuth();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const inFlight = useRef(new Set<string>());
  const refetch = useCallback(
    () => refreshAfterWrite(["favorites"]),
    [refreshAfterWrite],
  );
  const favorites = account.data.favorites;
  return {
    favorites,
    isLoading: account.loading,
    error: account.errors.favorites,
    refetch,
    pending,
    removeFavorite: account.removeFavorite,
    isFavorite: (identifier: FavoriteIdentifier) =>
      favorites.some((row) => matchesFavorite(row, identifier)),
    toggleFavorite: async (identifier: FavoriteIdentifier) => {
      if (!user) return;
      if (account.loading || account.errors.favorites)
        throw new Error(
          "Load your saved favorites before changing them. Please retry sync.",
        );
      const key =
        identifier.customShortcutId ??
        (identifier.itemType === "keymap"
          ? identifier.customKeymapId
          : undefined) ??
        (identifier.itemType === "app" ? identifier.customAppId : undefined) ??
        JSON.stringify(identifier);
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      setPending((previous) => new Set(previous).add(key));
      try {
        const existing = favorites.find((row) =>
          matchesFavorite(row, identifier),
        );
        if (existing) await account.removeFavorite(existing.id);
        else {
          const target = identifier.customShortcutId
            ? {
                itemType: identifier.itemType,
                customShortcutId: identifier.customShortcutId,
              }
            : identifier.itemType === "keymap" && identifier.customKeymapId
              ? {
                  itemType: identifier.itemType,
                  customKeymapId: identifier.customKeymapId,
                }
              : identifier.itemType === "app" && identifier.customAppId
                ? {
                    itemType: identifier.itemType,
                    customAppId: identifier.customAppId,
                  }
                : identifier;
          await account.addFavorite(target);
        }
      } finally {
        inFlight.current.delete(key);
        setPending((previous) => {
          const next = new Set(previous);
          next.delete(key);
          return next;
        });
      }
    },
  };
}
