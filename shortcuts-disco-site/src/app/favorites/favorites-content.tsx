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
import { serializeKeymap } from "@/lib/model/keymap-utils";
import type { Favorite } from "@/lib/model/user/user-models";

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
          Sign in to save your favorite apps
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref("/favorites")}>Sign In</Link>
        </Button>
      </section>
    );
  }

  const appFavorites = favorites.filter((f) => f.itemType === "app");
  const keymapFavorites = favorites.filter((f) => f.itemType === "keymap");
  const shortcutFavorites = favorites.filter((f) => f.itemType === "shortcut");

  if (favorites.length === 0) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Favorites</TypographyH1>
        <TypographyMuted className="mb-6">
          You haven&apos;t favorited anything yet.
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
                <FavoriteRow
                  key={fav.id}
                  favorite={fav}
                  label={`${fav.appSlug} / ${fav.keymapTitle}`}
                  href={getFavoriteHref(fav)}
                  onRemove={() =>
                    toggleFavorite({
                      itemType: "keymap",
                      appSlug: fav.appSlug!,
                      keymapTitle: fav.keymapTitle!,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
        {shortcutFavorites.length > 0 && (
          <div>
            <TypographyH3 className="mb-4">Shortcuts</TypographyH3>
            <div className="space-y-2">
              {shortcutFavorites.map((fav) => (
                <FavoriteRow
                  key={fav.id}
                  favorite={fav}
                  label={`${fav.shortcutTitle} (${fav.appSlug} / ${fav.keymapTitle})`}
                  href={getFavoriteHref(fav)}
                  onRemove={() =>
                    toggleFavorite({
                      itemType: "shortcut",
                      appSlug: fav.appSlug!,
                      keymapTitle: fav.keymapTitle!,
                      sectionTitle: fav.sectionTitle!,
                      shortcutTitle: fav.shortcutTitle!,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FavoriteRow({
  favorite,
  label,
  href,
  onRemove,
}: {
  favorite: Favorite;
  label: string;
  href: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <Link href={href} className="flex min-w-0 items-center gap-2 hover:underline">
        <span className="truncate">{label}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${label} from favorites`}
        onClick={onRemove}
      >
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      </Button>
    </div>
  );
}

function getFavoriteHref(favorite: Favorite): string {
  if (!favorite.appSlug) return "/";
  if (!favorite.keymapTitle) return `/apps/${favorite.appSlug}`;

  const keymapPath = serializeKeymap({
    title: favorite.keymapTitle,
    sections: [],
  });
  const sectionHash = favorite.sectionTitle
    ? `#${encodeURIComponent(favorite.sectionTitle)}`
    : "";

  return `/apps/${favorite.appSlug}/${keymapPath}${sectionHash}`;
}
