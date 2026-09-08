"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  itemType: "app" | "shortcut";
  appSlug: string;
  customAppId?: string;
  customShortcutId?: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
  baseShortcutId?: string;
  baseShortcutAliases?: string[];
  className?: string;
  size?: "default" | "sm" | "icon";
}

export function FavoriteButton({
  itemType,
  appSlug,
  customAppId,
  customShortcutId,
  keymapTitle,
  sectionTitle,
  shortcutTitle,
  baseShortcutId,
  baseShortcutAliases,
  className,
  size = "icon",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const favorited = isFavorite({
    itemType,
    appSlug,
  customAppId,
  customShortcutId,
    keymapTitle,
    sectionTitle,
    shortcutTitle,
    baseShortcutId,
  baseShortcutAliases,
  });

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      await toggleFavorite({
        itemType,
        appSlug,
  customAppId,
  customShortcutId,
        keymapTitle,
        sectionTitle,
        shortcutTitle,
        baseShortcutId,
  baseShortcutAliases,
      });
    } catch {
      // The shared account provider displays the retryable error.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn("h-8 w-8", className)}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Star
        className={cn(
          "h-4 w-4",
          favorited && "fill-yellow-400 text-yellow-400"
        )}
      />
    </Button>
  );
}
