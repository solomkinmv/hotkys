"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { favoritesService } from "@/lib/services/favorites-service";
import type { Favorite } from "@/lib/model/user/user-models";

interface FavoriteIdentifier {
  itemType: "app" | "keymap" | "shortcut";
  appSlug: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  isLoading: boolean;
  isFavorite: (identifier: FavoriteIdentifier) => boolean;
  toggleFavorite: (identifier: FavoriteIdentifier) => Promise<void>;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }): ReactNode {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await favoritesService.getFavorites(user);
      setFavorites(data);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (identifier: FavoriteIdentifier): boolean => {
      return favorites.some((f) => {
        if (f.itemType !== identifier.itemType) return false;
        if (f.appSlug !== identifier.appSlug) return false;

        if (identifier.itemType === "app") return true;

        if (identifier.itemType === "keymap") {
          return f.keymapTitle === identifier.keymapTitle;
        }

        if (identifier.itemType === "shortcut") {
          return (
            f.keymapTitle === identifier.keymapTitle &&
            f.sectionTitle === identifier.sectionTitle &&
            f.shortcutTitle === identifier.shortcutTitle
          );
        }

        return false;
      });
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (identifier: FavoriteIdentifier) => {
      if (!user) return;

      const wasAdded = await favoritesService.toggleFavorite(
        {
          itemType: identifier.itemType,
          appSlug: identifier.appSlug,
          keymapTitle: identifier.keymapTitle,
          sectionTitle: identifier.sectionTitle,
          shortcutTitle: identifier.shortcutTitle,
        },
        user
      );

      if (wasAdded) {
        await fetchFavorites();
      } else {
        setFavorites((prev) =>
          prev.filter((f) => {
            if (f.itemType !== identifier.itemType) return true;
            if (f.appSlug !== identifier.appSlug) return true;
            if (identifier.itemType === "app") return false;
            if (f.keymapTitle !== identifier.keymapTitle) return true;
            if (identifier.itemType === "keymap") return false;
            return (
              f.sectionTitle !== identifier.sectionTitle ||
              f.shortcutTitle !== identifier.shortcutTitle
            );
          })
        );
      }
    },
    [user, fetchFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        refetch: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
