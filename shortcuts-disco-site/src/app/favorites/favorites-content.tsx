"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { getLoginHref } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { TypographyH1, TypographyH3, TypographyMuted } from "@/components/ui/typography";
import { Star, ExternalLink } from "lucide-react";
import { favoriteHref, favoriteLabel, type PublicFavoriteApp } from "@/lib/navigation/shortcut-routes";
export function FavoritesContent({ publicApps = [] }: { publicApps?: PublicFavoriteApp[] }) {
  const { user, isLoading: authLoading } = useAuth();
  const { favorites, isLoading, removeFavorite, error } = useFavorites();
  const { customizations } = useCustomizations();
  const [pending, setPending] = useState<string[]>([]);
  if (authLoading || isLoading) return <TypographyMuted>Loading favorites…</TypographyMuted>;
  if (!user) return <section className="mx-auto max-w-md text-center"><TypographyH1>Favorites</TypographyH1><TypographyMuted>Sign in to save your favorite apps</TypographyMuted><Button asChild><Link href={getLoginHref("/favorites")}>Sign In</Link></Button></section>;
  const remove = async (id: string) => {
    setPending(previous => [...previous, id]);
    try { await removeFavorite(id); } catch { /* The account provider shows a retryable error. */ }
    finally { setPending(previous => previous.filter(item => item !== id)); }
  };
  return <section className="mx-auto max-w-2xl"><TypographyH1 className="mb-6">Favorites</TypographyH1>
    {!favorites.length && !error ? <><TypographyMuted>You haven&apos;t favorited anything yet.</TypographyMuted><Button asChild><Link href="/">Browse Shortcuts</Link></Button></> : null}
    {(["app", "keymap", "shortcut"] as const).map(type => {
      const rows = favorites.filter(favorite => favorite.itemType === type);
      if (!rows.length) return null;
      return <div key={type} className="mb-8 space-y-2"><TypographyH3>{type === "app" ? "Apps" : type === "keymap" ? "Keymaps" : "Shortcuts"}</TypographyH3>{rows.map(favorite => {
        const href = favoriteHref(favorite, customizations, publicApps);
        const label = favoriteLabel(favorite, customizations.customApps);
        return <div key={favorite.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          {href ? <Link href={href} className="flex min-w-0 items-center gap-2 hover:underline"><span className="truncate">{label}</span><ExternalLink className="h-3 w-3 shrink-0" /></Link> : <span>{label} — target unavailable</span>}
          <Button variant="ghost" size="icon" disabled={pending.includes(favorite.id)} aria-label={`Remove ${label} from favorites`} onClick={() => void remove(favorite.id)}><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /></Button>
        </div>;
      })}</div>;
    })}
  </section>;
}
