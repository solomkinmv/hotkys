"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  itemType: "app" | "keymap" | "shortcut";
  appSlug: string;
  keymapTitle?: string;
  sectionTitle?: string;
  shortcutTitle?: string;
  className?: string;
  size?: "default" | "sm" | "icon";
}

export function FavoriteButton({
  itemType,
  appSlug,
  keymapTitle,
  sectionTitle,
  shortcutTitle,
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
    keymapTitle,
    sectionTitle,
    shortcutTitle,
  });

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      await toggleFavorite({
        itemType,
        appSlug,
        keymapTitle,
        sectionTitle,
        shortcutTitle,
      });
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
