"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { getLoginHref } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/components/ui/typography";
import { Star, ExternalLink } from "lucide-react";

export function FavoritesContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { favorites, isLoading: favoritesLoading, toggleFavorite } = useFavorites();

  if (authLoading || favoritesLoading) {
    return (
      <section className="mx-auto max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Favorites</TypographyH1>
        <TypographyMuted className="mb-6">
          Sign in to save your favorite apps and keymaps
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref("/favorites")}>Sign In</Link>
        </Button>
      </section>
    );
  }

  const appFavorites = favorites.filter((f) => f.itemType === "app");
  const keymapFavorites = favorites.filter((f) => f.itemType === "keymap");

  if (appFavorites.length === 0 && keymapFavorites.length === 0) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Favorites</TypographyH1>
        <TypographyMuted className="mb-6">
          You haven&apos;t favorited any apps or keymaps yet.
        </TypographyMuted>
        <Button asChild>
          <Link href="/">Browse Shortcuts</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl">
      <TypographyH1 className="mb-6">Favorites</TypographyH1>

      <div className="space-y-8">
        {appFavorites.length > 0 && (
          <div>
            <TypographyH3 className="mb-4">Apps</TypographyH3>
            <div className="space-y-2">
              {appFavorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <Link
                    href={`/apps/${fav.appSlug}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    {fav.appSlug}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${fav.appSlug} from favorites`}
                    onClick={() =>
                      toggleFavorite({
                        itemType: "app",
                        appSlug: fav.appSlug!,
                      })
                    }
                  >
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {keymapFavorites.length > 0 && (
          <div>
            <TypographyH3 className="mb-4">Keymaps</TypographyH3>
            <div className="space-y-2">
              {keymapFavorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <Link
                      href={`/apps/${fav.appSlug}`}
                      className="hover:underline"
                    >
                      {fav.appSlug}
                    </Link>
                    <span className="text-muted-foreground"> / {fav.keymapTitle}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${fav.appSlug} ${fav.keymapTitle} from favorites`}
                    onClick={() =>
                      toggleFavorite({
                        itemType: "keymap",
                        appSlug: fav.appSlug!,
                        keymapTitle: fav.keymapTitle,
                      })
                    }
                  >
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
