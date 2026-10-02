"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLoginHref } from "@/lib/auth/redirect";

interface FavoriteButtonProps {
  itemType: "app" | "keymap" | "shortcut";
  appSlug: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
  baseShortcutId?: string;
  baseShortcutAliases?: string[];
  customAppId?: string;
  customKeymapId?: string;
  customShortcutId?: string;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "icon";
  showSignIn?: boolean;
}

export function FavoriteButton({
  itemType,
  appSlug,
  keymapTitle,
  sectionTitle,
  shortcutTitle,
  baseShortcutId,
  baseShortcutAliases,
  customAppId,
  customKeymapId,
  customShortcutId,
  label,
  className,
  size = "icon",
  showSignIn = false,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const {
    isFavorite,
    toggleFavorite,
    isLoading: favoritesLoading,
    error: favoritesError,
  } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  if (!user)
    return showSignIn ? (
      <Button
        asChild
        variant="ghost"
        size={size}
        className={cn("h-8 w-8", className)}
      >
        <Link
          href={getLoginHref(pathname)}
          aria-label={`Sign in to favorite ${appSlug}`}
        >
          <Star className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    ) : null;

  const favorited = isFavorite({
    itemType,
    appSlug,
    keymapTitle,
    sectionTitle,
    shortcutTitle,
    baseShortcutId,
    baseShortcutAliases,
    customAppId,
    customKeymapId,
    customShortcutId,
  });

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      await toggleFavorite({
        itemType,
        appSlug,
        keymapTitle,
        sectionTitle,
        shortcutTitle,
        baseShortcutId,
        baseShortcutAliases,
        customAppId,
        customKeymapId,
        customShortcutId,
      });
    } catch {
      setError("Could not update favorites. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        onClick={handleToggle}
        disabled={isLoading || favoritesLoading || !!favoritesError}
        className={cn("h-8 w-8", className)}
        aria-label={
          label
            ? `${favorited ? "Remove" : "Add"} ${label} ${favorited ? "from" : "to"} favorites`
            : favorited
              ? "Remove from favorites"
              : "Add to favorites"
        }
        aria-pressed={favorited}
        title={error ?? undefined}
      >
        <Star
          className={cn("h-4 w-4", favorited && "fill-brand text-brand")}
          aria-hidden="true"
        />
      </Button>
      {error && (
        <span role="alert" className="sr-only">
          {error}
        </span>
      )}
    </>
  );
}
