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
import {
  assertResourceLimit,
  USER_CONTENT_LIMITS,
} from "@/lib/validation/user-content";

interface FavoriteIdentifier {
  itemType: "app" | "keymap" | "shortcut";
  appSlug: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
  baseShortcutId?: string;
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
      return favorites.some((favorite) =>
        matchesFavorite(favorite, identifier),
      );
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (identifier: FavoriteIdentifier) => {
      if (!user) return;

      if (!isFavorite(identifier)) {
        assertResourceLimit(
          favorites.length,
          USER_CONTENT_LIMITS.favorites,
          "favorites",
        );
      }

      const existingFavorite = favorites.find((favorite) =>
        matchesFavorite(favorite, identifier),
      );
      const persistedIdentifier =
        existingFavorite && !existingFavorite.baseShortcutId
          ? { ...identifier, baseShortcutId: undefined }
          : identifier;

      const wasAdded = await favoritesService.toggleFavorite(
        {
          itemType: persistedIdentifier.itemType,
          appSlug: persistedIdentifier.appSlug,
          keymapTitle: persistedIdentifier.keymapTitle,
          sectionTitle: persistedIdentifier.sectionTitle,
          shortcutTitle: persistedIdentifier.shortcutTitle,
          baseShortcutId: persistedIdentifier.baseShortcutId,
        },
        user
      );

      if (wasAdded) {
        await fetchFavorites();
      } else {
        setFavorites((prev) =>
          prev.filter((favorite) => !matchesFavorite(favorite, identifier)),
        );
      }
    },
    [user, favorites, fetchFavorites, isFavorite]
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

function matchesFavorite(
  favorite: Favorite,
  identifier: FavoriteIdentifier,
): boolean {
  if (favorite.itemType !== identifier.itemType) return false;
  if (favorite.appSlug !== identifier.appSlug) return false;
  if (identifier.itemType === "app") return true;
  if (favorite.keymapTitle !== identifier.keymapTitle) return false;
  if (identifier.itemType === "keymap") return true;
  if (favorite.sectionTitle !== identifier.sectionTitle) return false;

  if (favorite.baseShortcutId && identifier.baseShortcutId) {
    return favorite.baseShortcutId === identifier.baseShortcutId;
  }

  return favorite.shortcutTitle === identifier.shortcutTitle;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
