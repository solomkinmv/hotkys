"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, Star } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { favoritesService } from "@/lib/services/favorites-service";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import { getLoginHref } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/app-icon";
import { SearchBar } from "@/components/ui/search-bar";
import { ShortcutMethod } from "@/components/shortcuts/shortcut-method";
import { serializeKeymap } from "@/lib/model/keymap-utils";
import { appDescriptions } from "@/lib/app-descriptions";
import type {
  AppShortcuts,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import type {
  CustomApp,
  CustomKeymap,
  Favorite,
} from "@/lib/model/user/user-models";

const filters = [
  ["all", "All"],
  ["app", "Apps"],
  ["keymap", "Keymaps"],
  ["shortcut", "Shortcuts"],
] as const;

export function FavoritesContent({
  applications = [],
}: {
  applications?: AppShortcuts[];
}) {
  const { user, isLoading: authLoading } = useAuth();
  const {
    favorites,
    isLoading: favoritesLoading,
    error: favoritesError,
    refetch,
  } = useFavorites();
  const {
    customizations,
    isLoading: customizationsLoading,
    error: customizationsError,
    refetch: refetchCustomizations,
  } = useCustomizations();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Favorite["itemType"]>("all");
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mergedApps = useMemo(
    () =>
      new ShortcutMerger(customizations).mergeShortcuts(
        applications,
        customizations,
      ),
    [applications, customizations],
  );
  const entries = favorites.map((favorite) =>
    resolveFavorite(
      favorite,
      mergedApps,
      customizations.customApps,
      customizations.customKeymaps,
      applications,
    ),
  );
  const visible = entries.filter(
    (entry) =>
      (filter === "all" || entry.favorite.itemType === filter) &&
      [entry.appName, entry.title, entry.keymapTitle, entry.sectionTitle]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const removeFavorite = async (favorite: Favorite) => {
    if (!user || removing) return;
    setRemoving(favorite.id);
    setError(null);
    try {
      // Remove the persisted row, retaining stable and custom-app identities.
      await favoritesService.removeFavorite(favorite.id, user);
      await refetch();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove this favorite. Please try again.",
      );
    } finally {
      setRemoving(null);
    }
  };
  const removeButton = (entry: FavoriteEntry) => (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 rounded-lg text-brand"
      aria-label={`Remove ${entry.title} from favorites`}
      disabled={removing !== null}
      onClick={() => removeFavorite(entry.favorite)}
    >
      <Star className="size-4 fill-current" aria-hidden="true" />
    </Button>
  );

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm text-brand">
            <Star className="size-4" aria-hidden="true" />
            Your collection
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.055em] md:text-5xl">
            Favorites
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            The apps you reach for. The shortcuts you want to remember.
          </p>
        </div>
        <Button asChild variant="outline" className="self-start rounded-xl">
          <Link href="/#applications">
            Explore apps <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      {authLoading || (user && (favoritesLoading || customizationsLoading)) ? (
        <div
          role="status"
          aria-label="Loading favorites"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border bg-muted/50"
            />
          ))}
        </div>
      ) : user && (favoritesError || customizationsError) ? (
        <div role="alert" className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Couldn’t load your collection
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {favoritesError || customizationsError}
          </p>
          <Button
            variant="outline"
            className="mt-5 rounded-xl"
            onClick={() =>
              Promise.allSettled([refetch(), refetchCustomizations()])
            }
          >
            Retry loading
          </Button>
        </div>
      ) : !user ? (
        <div className="grid items-center gap-8 rounded-2xl border bg-card p-6 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <span className="mb-5 flex size-12 items-center justify-center rounded-xl border border-brand/20 bg-brand/8 text-brand">
              <Star className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">
              Keep your favorites close.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Sign in to save apps and individual shortcuts. Your collection
              will be here whenever you need it.
            </p>
          </div>
          <Button asChild className="self-start rounded-xl">
            <Link href={getLoginHref("/favorites")}>
              Sign in to save favorites{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <Star className="mx-auto mb-5 size-8 text-brand" aria-hidden="true" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Make this space yours.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Tap the star on an app or shortcut to keep it here. Start with an
            app you use every day.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/#applications">
              Find your first favorite{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-2xl border bg-muted/40 p-4">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              aria-label="Search favorites"
              placeholder="Search your apps and shortcuts…"
              className="h-12 rounded-xl bg-card text-base"
            />
            <div
              className="mt-3 flex flex-wrap gap-1"
              role="group"
              aria-label="Favorite type"
            >
              {filters.map(([value, label]) => (
                <Button
                  key={value}
                  variant={filter === value ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className="rounded-lg aria-pressed:text-brand"
                >
                  {label}
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    {value === "all"
                      ? favorites.length
                      : favorites.filter((f) => f.itemType === value).length}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <p role="status" className="sr-only">
            {visible.length} saved items
          </p>
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <Search
                className="mx-auto mb-4 size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="font-semibold">No matching favorites</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another search or view your whole collection.
              </p>
              <Button
                variant="outline"
                className="mt-5 rounded-xl"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {(["app", "keymap"] as const).map((type) => {
                const items = visible.filter(
                  (e) => e.favorite.itemType === type,
                );
                return (
                  items.length > 0 && (
                    <section
                      key={type}
                      aria-label={
                        type === "app" ? "Saved apps" : "Saved keymaps"
                      }
                    >
                      <h2 className="mb-4 text-xl font-semibold tracking-tight">
                        {type === "app" ? "Apps" : "Keymaps"}{" "}
                        <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                          {items.length}
                        </span>
                      </h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((entry) => (
                          <div
                            key={entry.favorite.id}
                            className="relative rounded-2xl border bg-card transition-colors hover:border-brand/35"
                          >
                            <Link
                              href={entry.href}
                              className="block rounded-2xl p-5 pr-14"
                            >
                              <AppIcon
                                icon={entry.app?.icon}
                                appName={entry.appName}
                                size="md"
                                className="mb-5 size-11 rounded-xl [&_img]:object-contain"
                              />
                              <h3 className="font-semibold tracking-tight">
                                {entry.title}
                              </h3>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {type === "keymap"
                                  ? entry.appName
                                  : (appDescriptions[entry.app?.slug ?? ""] ??
                                    "Your saved shortcut collection.")}
                              </p>
                              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                {entry.app
                                  ? type === "app"
                                    ? "Open app"
                                    : "Open keymap"
                                  : "App unavailable"}
                                <ArrowUpRight
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              </p>
                            </Link>
                            <div className="absolute top-4 right-3">
                              {removeButton(entry)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )
                );
              })}
              {visible.some((e) => e.favorite.itemType === "shortcut") && (
                <section aria-label="Saved shortcuts">
                  <h2 className="mb-4 text-xl font-semibold tracking-tight">
                    Shortcuts
                  </h2>
                  <div className="space-y-5">
                    {Array.from(
                      new Set(
                        visible
                          .filter((e) => e.favorite.itemType === "shortcut")
                          .map((e) => e.groupKey),
                      ),
                    ).map((group) => {
                      const items = visible.filter(
                        (e) =>
                          e.favorite.itemType === "shortcut" &&
                          e.groupKey === group,
                      );
                      const first = items[0];
                      return (
                        <div
                          key={group}
                          className="rounded-2xl border bg-card p-3 sm:p-4"
                        >
                          <div className="mb-4 flex items-center gap-3 px-2 pt-2">
                            <AppIcon
                              icon={first.app?.icon}
                              appName={first.appName}
                              size="md"
                              className="rounded-lg [&_img]:object-contain"
                            />
                            <div>
                              <h3 className="font-semibold tracking-tight">
                                {first.appName}
                              </h3>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {first.keymapTitle}
                              </p>
                            </div>
                          </div>
                          {items.map((entry) => (
                            <div
                              key={entry.favorite.id}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 rounded-xl px-3 py-3 odd:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
                            >
                              <Link
                                href={entry.href}
                                className="col-start-1 row-start-1 min-w-0 text-sm font-medium hover:text-brand"
                              >
                                <span>{entry.title}</span>
                                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                  {entry.sectionTitle}
                                </span>
                              </Link>
                              <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                                {entry.shortcut ? (
                                  <ShortcutMethod shortcut={entry.shortcut} />
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Shortcut unavailable. You can still remove
                                    this favorite.
                                  </p>
                                )}
                              </div>
                              <div className="col-start-2 row-start-1 sm:col-start-3">
                                {removeButton(entry)}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

interface FavoriteEntry {
  favorite: Favorite;
  app?: AppShortcuts;
  appName: string;
  title: string;
  href: string;
  keymapTitle?: string;
  sectionTitle?: string;
  groupKey: string;
  shortcut?: SectionShortcut;
}
function resolveFavorite(
  favorite: Favorite,
  apps: AppShortcuts[],
  customApps: CustomApp[],
  publicCustomKeymaps: CustomKeymap[],
  publicCatalog: AppShortcuts[],
): FavoriteEntry {
  const stableLocation =
    favorite.customShortcutId || favorite.baseShortcutId
      ? uniqueMatch(
          apps.flatMap((app) =>
            app.keymaps.flatMap((keymap) =>
              keymap.sections.flatMap((section) =>
                section.hotkeys.map((shortcut) => ({
                  app,
                  keymap,
                  section,
                  shortcut,
                })),
              ),
            ),
          ),
          (entry) =>
            favorite.customShortcutId
              ? entry.shortcut.customShortcutId === favorite.customShortcutId ||
                entry.shortcut.customizationId === favorite.customShortcutId
              : entry.app.slug === favorite.appSlug &&
                entry.keymap.title === favorite.keymapTitle &&
                (entry.shortcut.baseSectionTitle ?? entry.section.title) ===
                  favorite.sectionTitle &&
                (entry.shortcut.baseShortcutId === favorite.baseShortcutId ||
                  !!entry.shortcut.baseShortcutAliases?.includes(
                    favorite.baseShortcutId!,
                  )),
        )
      : undefined;
  const publicKeymap = publicCustomKeymaps.find(
    (keymap) =>
      keymap.id ===
      (favorite.customKeymapId ?? stableLocation?.keymap.customKeymapId),
  );
  const custom = customApps.find((a) =>
    favorite.customShortcutId
      ? a.keymaps.some((k) =>
          k.sections.some((s) =>
            s.shortcuts.some((h) => h.id === favorite.customShortcutId),
          ),
        )
      : favorite.customKeymapId
        ? a.keymaps.some((k) => k.id === favorite.customKeymapId)
        : favorite.customAppId
          ? a.id === favorite.customAppId
          : `custom-${a.slug}` === favorite.appSlug,
  );
  const app =
    stableLocation?.app ??
    apps.find(
      (a) =>
        a.slug ===
        (custom
          ? `custom-${custom.slug}`
          : (publicKeymap?.baseAppSlug ?? favorite.appSlug)),
    );
  // Unresolved legacy rows may have duplicate names. Keep them removable
  // without guessing which private record the user originally saved.
  const privateKeymap = uniqueMatch(custom?.keymaps, (k) =>
    favorite.customShortcutId
      ? k.sections.some((section) =>
          section.shortcuts.some((h) => h.id === favorite.customShortcutId),
        )
      : favorite.customKeymapId
        ? k.id === favorite.customKeymapId
        : k.title === favorite.keymapTitle,
  );
  const privateSection = uniqueMatch(privateKeymap?.sections, (section) =>
    favorite.customShortcutId
      ? section.shortcuts.some((h) => h.id === favorite.customShortcutId)
      : section.title === favorite.sectionTitle,
  );
  const privateShortcut = uniqueMatch(privateSection?.shortcuts, (h) =>
    favorite.customShortcutId
      ? h.id === favorite.customShortcutId
      : h.title === favorite.shortcutTitle,
  );
  const keymapTitle =
    privateKeymap?.title ??
    publicKeymap?.title ??
    stableLocation?.keymap.title ??
    favorite.keymapTitle;
  const sectionTitle =
    privateSection?.title ??
    stableLocation?.section.title ??
    favorite.sectionTitle;
  const keymap =
    stableLocation?.keymap ??
    app?.keymaps.find((k) => k.title === keymapTitle) ??
    (favorite.itemType === "app" ? app?.keymaps[0] : undefined);
  const section = keymap?.sections.find(
    (section) => section.title === sectionTitle,
  );
  const shortcut =
    stableLocation?.shortcut ??
    (custom
      ? app?.keymaps
          .flatMap((k) => k.sections.flatMap((section) => section.hotkeys))
          .find((h) => h.customizationId === privateShortcut?.id)
      : section?.hotkeys.find((h) =>
          favorite.baseShortcutId
            ? h.baseShortcutId === favorite.baseShortcutId ||
              !!h.baseShortcutAliases?.includes(favorite.baseShortcutId)
            : (h.baseShortcutTitle ?? h.title) === favorite.shortcutTitle,
        ));
  const addedKeymapId = keymap?.customKeymapId;
  const routeKeymap = addedKeymapId
    ? publicCatalog.find((a) => a.slug === app?.slug)?.keymaps[0]
    : keymap;
  const href = custom
    ? `/my-shortcuts?app=${encodeURIComponent(custom.slug)}${privateKeymap ? `&keymap=${encodeURIComponent(privateKeymap.id)}` : ""}${privateShortcut ? `#shortcut-${privateShortcut.id}` : ""}`
    : app
      ? `/apps/${app.slug}${routeKeymap ? `/${serializeKeymap(routeKeymap)}` : ""}${addedKeymapId ? `?keymap=${encodeURIComponent(addedKeymapId)}` : ""}${sectionTitle ? `#${encodeURIComponent(sectionTitle)}` : ""}`
      : "/#applications";
  const appName = app?.name ?? favorite.appSlug ?? "Unavailable app";
  return {
    favorite,
    app,
    appName,
    shortcut,
    href,
    keymapTitle,
    sectionTitle,
    groupKey: `${custom?.id ?? app?.slug ?? favorite.appSlug}/${privateKeymap?.id ?? addedKeymapId ?? keymapTitle}`,
    title:
      favorite.itemType === "app"
        ? appName
        : favorite.itemType === "keymap"
          ? (keymapTitle ?? "Saved keymap")
          : (shortcut?.title ?? favorite.shortcutTitle ?? "Saved shortcut"),
  };
}

function uniqueMatch<T>(
  items: T[] | undefined,
  predicate: (item: T) => boolean,
): T | undefined {
  const matches = items?.filter(predicate);
  return matches?.length === 1 ? matches[0] : undefined;
}
