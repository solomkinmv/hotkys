"use client";

import {
  AppShortcuts,
  Keymap,
  Section,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import { ShortcutDisplay } from "@/components/ui/shortcut-display";
import {
  Modifiers,
  modifierMapping,
  modifierSymbols,
} from "@/lib/model/internal/modifiers";
import { SeparatorWithText } from "@/components/ui/separator-with-text";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import Fuse from "fuse.js";
import { KeymapSelector } from "@/app/apps/[slug]/[keymap]/keymap-selector";
import TableOfContents from "@/app/apps/[slug]/[keymap]/table-of-contents";
import Link from "next/link";
import { ListItem } from "@/components/ui/list";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Menu, Pencil, Plus, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { useAuth } from "@/components/auth/auth-provider";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import { customizationsService } from "@/lib/services/customizations-service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewMode = "list" | "cheatsheet";
type DisplayShortcut = Keymap["sections"][number]["hotkeys"][number] & {
  favoriteSourceSectionTitle?: string;
};
type DisplaySection = Omit<Section, "hotkeys"> & {
  hotkeys: DisplayShortcut[];
};
type ShortcutDialogState =
  | {
      type: "add";
      sectionTitle: string;
    }
  | {
      type: "override";
      sectionTitle: string;
      shortcutTitle: string;
    };
type ShortcutDraft = {
  title: string;
  key: string;
  comment: string;
};

const VIEW_MODE_STORAGE_KEY = "shortcuts-view-mode";
const COLUMN_COUNT_STORAGE_KEY = "shortcuts-column-count";
const FAVORITE_SHORTCUTS_SECTION_TITLE = "Favorite shortcuts";
const DEFAULT_COLUMNS = 4;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 6;
const MIN_COLUMN_WIDTH = 288;
const emptyShortcutDraft: ShortcutDraft = {
  title: "",
  key: "",
  comment: "",
};

function parseViewMode(value: string | null): ViewMode | null {
  if (value === "cheatsheet") return "cheatsheet";
  if (value === "list") return "list";
  return null;
}

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "cheatsheet" ? "cheatsheet" : "list";
}

function parseColumnCount(value: string | null): number | null {
  if (value === null) return null;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < MIN_COLUMNS || num > MAX_COLUMNS) return null;
  return num;
}

function normalizeColumnCount(value: number): number {
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, value));
}

function getStoredColumnCount(): number {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  const stored = localStorage.getItem(COLUMN_COUNT_STORAGE_KEY);
  const parsed = parseColumnCount(stored);
  return parsed ?? DEFAULT_COLUMNS;
}

export const AppDetails = ({
  application,
  keymap,
}: {
  application: AppShortcuts;
  keymap: Keymap;
}) => {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const {
    customizations,
    refetch: refetchCustomizations,
  } = useCustomizations();
  const {
    preferences,
    isLoading: preferencesLoading,
    updatePreferences,
  } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlViewMode = parseViewMode(searchParams.get("view"));
  const urlColumnCount = parseColumnCount(searchParams.get("cols"));
  const mergedApplication = useMemo(() => {
    if (!user) {
      return application;
    }

    return (
      new ShortcutMerger(customizations).mergeShortcuts(
        [application],
        customizations
      )[0] ?? application
    );
  }, [application, customizations, user]);
  const displayKeymap = useMemo(
    () =>
      mergedApplication.keymaps.find(
        (mergedKeymap) => mergedKeymap.title === keymap.title
      ) ?? keymap,
    [keymap, mergedApplication]
  );

  const [viewMode, setViewModeState] = useState<ViewMode>("list");
  const [userColumnCount, setUserColumnCountState] = useState<number>(DEFAULT_COLUMNS);
  const [maxColumns, setMaxColumns] = useState<number>(MAX_COLUMNS);
  const [shortcutDialog, setShortcutDialog] =
    useState<ShortcutDialogState | null>(null);
  const [shortcutDraft, setShortcutDraft] =
    useState<ShortcutDraft>(emptyShortcutDraft);
  const [shortcutDialogError, setShortcutDialogError] = useState<string | null>(
    null
  );
  const [isSavingShortcut, setIsSavingShortcut] = useState(false);

  const effectiveColumnCount = Math.min(userColumnCount, maxColumns);

  useEffect(() => {
    const effectiveMode =
      urlViewMode ??
      (user && !preferencesLoading ? preferences.viewMode : getStoredViewMode());
    setViewModeState(effectiveMode);
  }, [urlViewMode, user, preferencesLoading, preferences.viewMode]);

  useEffect(() => {
    const effectiveCols =
      urlColumnCount ??
      (user && !preferencesLoading
        ? normalizeColumnCount(preferences.columnCount)
        : getStoredColumnCount());
    setUserColumnCountState(effectiveCols);
  }, [urlColumnCount, user, preferencesLoading, preferences.columnCount]);

  useEffect(() => {
    if (viewMode !== "cheatsheet") return;

    const updateMaxColumns = () => {
      const padding = 48;
      const availableWidth = window.innerWidth - padding;
      const gap = 16;
      const max = Math.max(1, Math.floor((availableWidth + gap) / (MIN_COLUMN_WIDTH + gap)));
      setMaxColumns(max);
    };

    updateMaxColumns();
    window.addEventListener("resize", updateMaxColumns);

    return () => window.removeEventListener("resize", updateMaxColumns);
  }, [viewMode]);

  const setViewMode = (newMode: ViewMode) => {
    setViewModeState(newMode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, newMode);
    if (user && !preferencesLoading) {
      void updatePreferences({ viewMode: newMode }).catch((error) => {
        console.error("Failed to save view preference:", error);
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    if (newMode === "list") {
      params.delete("view");
    } else {
      params.set("view", newMode);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setColumnCount = (newCount: number) => {
    setUserColumnCountState(newCount);
    localStorage.setItem(COLUMN_COUNT_STORAGE_KEY, String(newCount));
    if (user && !preferencesLoading) {
      void updatePreferences({ columnCount: newCount }).catch((error) => {
        console.error("Failed to save column preference:", error);
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    if (newCount === DEFAULT_COLUMNS) {
      params.delete("cols");
    } else {
      params.set("cols", String(newCount));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const [searchResults, setSearchResults] = useState<DisplaySection[]>(
    displayKeymap.sections,
  );
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sectionSheetOpen, setSectionSheetOpen] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setSearchResults(displayKeymap.sections);
    setSelectedIndex(-1);
  }, [displayKeymap]);

  const hotkeys = displayKeymap.sections.flatMap((section) =>
    section.hotkeys.map((hotkey) => ({
      ...hotkey,
      sectionTitle: section.title,
    })),
  );

  const fuse = new Fuse(hotkeys, {
    keys: ["title"],
    includeScore: true,
    includeMatches: true,
  });

  const favoriteShortcutItems = user
    ? favorites
        .flatMap((favorite) => {
          if (
            favorite.itemType !== "shortcut" ||
            favorite.appSlug !== application.slug ||
            favorite.keymapTitle !== displayKeymap.title ||
            !favorite.sectionTitle ||
            !favorite.shortcutTitle
          ) {
            return [];
          }

          const section = searchResults.find(
            (section) => section.title === favorite.sectionTitle,
          );
          const shortcut = section?.hotkeys.find(
            (hotkey) => hotkey.title === favorite.shortcutTitle,
          );

          if (!shortcut) {
            return [];
          }

          return [
            {
              sectionTitle: favorite.sectionTitle,
              shortcut,
            },
          ];
        })
    : [];

  const favoriteShortcutsSection: DisplaySection | null =
    favoriteShortcutItems.length > 0
      ? {
          title: FAVORITE_SHORTCUTS_SECTION_TITLE,
          hotkeys: favoriteShortcutItems.map(({ sectionTitle, shortcut }) => ({
            ...shortcut,
            favoriteSourceSectionTitle: sectionTitle,
          })),
        }
      : null;

  const displaySections: DisplaySection[] = favoriteShortcutsSection
    ? [favoriteShortcutsSection, ...searchResults]
    : searchResults;

  const totalItems = displaySections.reduce(
    (sum, section) => sum + section.hotkeys.length,
    0,
  );

  const isOfficialShortcut = (sectionTitle: string, shortcutTitle: string) =>
    keymap.sections.some(
      (section) =>
        section.title === sectionTitle &&
        section.hotkeys.some((hotkey) => hotkey.title === shortcutTitle)
    );

  const openAddShortcutDialog = (sectionTitle: string) => {
    setShortcutDialog({ type: "add", sectionTitle });
    setShortcutDraft(emptyShortcutDraft);
    setShortcutDialogError(null);
  };

  const openOverrideShortcutDialog = (
    sectionTitle: string,
    shortcut: SectionShortcut
  ) => {
    setShortcutDialog({
      type: "override",
      sectionTitle,
      shortcutTitle: shortcut.title,
    });
    setShortcutDraft({
      title: shortcut.title,
      key: formatShortcutForInput(shortcut),
      comment: shortcut.comment ?? "",
    });
    setShortcutDialogError(null);
  };

  const closeShortcutDialog = () => {
    setShortcutDialog(null);
    setShortcutDraft(emptyShortcutDraft);
    setShortcutDialogError(null);
  };

  const handleSaveShortcutDialog = async () => {
    if (!user || !shortcutDialog) return;

    const title = shortcutDraft.title.trim();
    const key = shortcutDraft.key.trim() || undefined;
    const comment = shortcutDraft.comment.trim() || undefined;
    if (!title) {
      setShortcutDialogError("Shortcut title is required.");
      return;
    }

    setIsSavingShortcut(true);
    setShortcutDialogError(null);
    try {
      if (shortcutDialog.type === "add") {
        await customizationsService.createBaseAppShortcut(
          {
            baseAppSlug: application.slug,
            keymapTitle: keymap.title,
            sectionTitle: shortcutDialog.sectionTitle,
            title,
            key,
            comment,
          },
          user
        );
      } else {
        await customizationsService.upsertShortcutOverlay(
          {
            baseAppSlug: application.slug,
            baseKeymapTitle: keymap.title,
            baseSectionTitle: shortcutDialog.sectionTitle,
            baseShortcutTitle: shortcutDialog.shortcutTitle,
            title,
            key,
            comment,
            isDeleted: false,
            sortOrder: 0,
          },
          user
        );
      }
      await refetchCustomizations();
      closeShortcutDialog();
    } catch (error) {
      setShortcutDialogError(
        error instanceof Error ? error.message : "Unable to save shortcut."
      );
    } finally {
      setIsSavingShortcut(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      const results = fuse.search(event.target.value);
      const resultTitles = results.map((result) => result.item.title);
      const filteredSections = displayKeymap.sections
        .map((section) => {
          const filteredHotkeys = section.hotkeys.filter((hotkey) =>
            resultTitles.includes(hotkey.title),
          );
          return { ...section, hotkeys: filteredHotkeys };
        })
        .filter((section) => section.hotkeys.length > 0);
      setSearchResults(filteredSections);
    } else {
      setSearchResults(displayKeymap.sections);
    }
    setSelectedIndex(-1);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % totalItems;
          itemRefs.current[newIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return newIndex;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex = (prevIndex - 1 + totalItems) % totalItems;
          itemRefs.current[newIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return newIndex;
        });
      } else if (e.key === "Escape") {
        setSelectedIndex(-1);
      }
    },
    [totalItems],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const sectionRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>(
    {},
  );
  let globalIndex = 0;
  const appDetails = displaySections.map((section) => {
    sectionRefs.current[section.title] = React.createRef();
    return (
      <div
        id={section.title}
        key={section.title}
        ref={sectionRefs.current[section.title]}
      >
        <div>
          <SeparatorWithText>
            <span className="inline-flex items-center">
              <span>{section.title}</span>
              {user && section.title !== FAVORITE_SHORTCUTS_SECTION_TITLE && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="ml-3 gap-1.5"
                  onClick={() => openAddShortcutDialog(section.title)}
                  aria-label={`Add shortcut to ${section.title}`}
                >
                  <Plus className="h-4 w-4" />
                  Add shortcut
                </Button>
              )}
            </span>
          </SeparatorWithText>
        </div>
        {section.hotkeys.map((hotkey) => {
          const currentIndex = globalIndex++;
          const favoriteSectionTitle =
            hotkey.favoriteSourceSectionTitle ?? section.title;
          const canOverride =
            user && isOfficialShortcut(favoriteSectionTitle, hotkey.title);
          return (
            <ListItem
              key={hotkey.title + currentIndex}
              selected={selectedIndex === currentIndex}
              ref={(el) => {
                itemRefs.current[currentIndex] = el;
              }}
            >
              <span className="font-medium inline-flex min-w-0 items-center gap-2">
                <FavoriteButton
                  itemType="shortcut"
                  appSlug={application.slug}
                  keymapTitle={displayKeymap.title}
                  sectionTitle={favoriteSectionTitle}
                  shortcutTitle={hotkey.title}
                  className="shrink-0"
                />
                <span>{hotkey.title}</span>
                <ShortcutDisplay shortcut={hotkey} />
              </span>
              <span className="flex shrink-0 items-center gap-2 text-right text-muted-foreground">
                <span>{generateCommentText(hotkey.comment)}</span>
                {canOverride && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      openOverrideShortcutDialog(favoriteSectionTitle, hotkey)
                    }
                    aria-label={`Customize ${hotkey.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </span>
            </ListItem>
          );
        })}
      </div>
    );
  });

  const cheatsheetView = (
    <MasonryGrid
      items={displaySections}
      columnCount={effectiveColumnCount}
      getItemHeight={(section) => section.hotkeys.length + 1}
      renderItem={(section) => {
        sectionRefs.current[section.title] = React.createRef();
        return (
          <div
            id={section.title}
            ref={sectionRefs.current[section.title]}
            className="border rounded-lg p-3"
          >
            <div className="mb-2 flex items-center gap-1">
              <TypographyMuted className="font-semibold">
                {section.title}
              </TypographyMuted>
              {user && section.title !== FAVORITE_SHORTCUTS_SECTION_TITLE && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="ml-3 gap-1.5"
                  onClick={() => openAddShortcutDialog(section.title)}
                  aria-label={`Add shortcut to ${section.title}`}
                >
                  <Plus className="h-4 w-4" />
                  Add shortcut
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {section.hotkeys.map((hotkey, idx) => {
                const favoriteSectionTitle =
                  hotkey.favoriteSourceSectionTitle ?? section.title;
                const canOverride =
                  user && isOfficialShortcut(favoriteSectionTitle, hotkey.title);
                return (
                  <div
                    key={hotkey.title + idx}
                    className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-sm py-1"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="inline-flex items-center gap-1">
                        <FavoriteButton
                          itemType="shortcut"
                          appSlug={application.slug}
                          keymapTitle={displayKeymap.title}
                          sectionTitle={favoriteSectionTitle}
                          shortcutTitle={hotkey.title}
                          className="shrink-0"
                        />
                        <span>{hotkey.title}</span>
                        {canOverride && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              openOverrideShortcutDialog(
                                favoriteSectionTitle,
                                hotkey
                              )
                            }
                            aria-label={`Customize ${hotkey.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </span>
                      {hotkey.comment && (
                        <span className="text-xs text-muted-foreground">
                          {generateCommentText(hotkey.comment)}
                        </span>
                      )}
                    </div>
                    <ShortcutDisplay shortcut={hotkey} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-2">
          {viewMode === "list" && (
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setSectionSheetOpen(true)}
            >
              <Menu className="h-4 w-4 mr-1" />
              Sections
            </Button>
          )}
          <KeymapSelector
            keymaps={application.keymaps}
            activeKeymap={keymap.title}
            urlPrefix={`/apps/${application.slug}`}
          />
          <FavoriteButton
            itemType="keymap"
            appSlug={application.slug}
            keymapTitle={displayKeymap.title}
          />
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cheatsheet" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("cheatsheet")}
              aria-label="Cheat sheet view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            {viewMode === "cheatsheet" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Column settings">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <TypographySmall>Columns</TypographySmall>
                      <TypographyMuted>{effectiveColumnCount}</TypographyMuted>
                    </div>
                    <Slider
                      min={MIN_COLUMNS}
                      max={MAX_COLUMNS}
                      step={1}
                      value={[userColumnCount]}
                      onValueChange={([value]) => setColumnCount(value)}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {application.source && (
            <Link
              href={application.source}
              className="text-sm text-muted-foreground hover:underline"
            >
              Source
            </Link>
          )}
        </div>
        <SearchBar onChange={handleSearch} />
      </div>
      {viewMode === "list" ? (
        <>
          <Sheet open={sectionSheetOpen} onOpenChange={setSectionSheetOpen}>
            <SheetContent side="left" className="w-64 overflow-y-auto">
              <SheetTitle className="sr-only">Sections</SheetTitle>
              <TableOfContents
                sections={displaySections}
                sectionRefs={sectionRefs}
                onSectionClick={() => setSectionSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="mx-auto max-w-5xl flex">
            <div className="hidden md:block px-4 md:w-56 shrink-0">
              <TableOfContents
                sections={displaySections}
                sectionRefs={sectionRefs}
              />
            </div>
            <div className="md:border-l flex-1 px-4 md:px-6 pb-6">{appDetails}</div>
          </div>
        </>
      ) : (
        <div className="px-4 md:px-6 pb-6 mx-auto" style={{ maxWidth: `${effectiveColumnCount * 288 + (effectiveColumnCount - 1) * 16 + 48}px` }}>{cheatsheetView}</div>
      )}
      <Dialog
        open={shortcutDialog !== null}
        onOpenChange={(open) => {
          if (!open) closeShortcutDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shortcutDialog?.type === "add"
                ? "Add Shortcut"
                : "Customize Shortcut"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="shortcut-title">Title</Label>
              <Input
                id="shortcut-title"
                value={shortcutDraft.title}
                onChange={(event) =>
                  setShortcutDraft((draft) => ({
                    ...draft,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortcut-key">Keys</Label>
              <Input
                id="shortcut-key"
                value={shortcutDraft.key}
                onChange={(event) =>
                  setShortcutDraft((draft) => ({
                    ...draft,
                    key: event.target.value,
                  }))
                }
                placeholder="cmd+k"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortcut-comment">Comment</Label>
              <Input
                id="shortcut-comment"
                value={shortcutDraft.comment}
                onChange={(event) =>
                  setShortcutDraft((draft) => ({
                    ...draft,
                    comment: event.target.value,
                  }))
                }
              />
            </div>
            {shortcutDialogError && (
              <p className="text-sm text-destructive" role="alert">
                {shortcutDialogError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeShortcutDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveShortcutDialog} disabled={isSavingShortcut}>
              {isSavingShortcut ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function generateCommentText(
  optionalComment: string | undefined,
): string | undefined {
  if (optionalComment === undefined) {
    return undefined;
  }
  let comment = optionalComment;
  modifierMapping.forEach((modifier, text) => {
    comment = comment.replace(
      "{" + text + "}",
      modifierSymbols.get(modifier) ?? "",
    );
  });
  baseKeySymbolOverride.forEach((symbol, key) => {
    comment = comment.replace("{" + key + "}", symbol);
  });
  return comment;
}

function formatShortcutForInput(shortcut: SectionShortcut): string {
  return shortcut.sequence.map(formatAtomicShortcutForInput).join(" ");
}

function formatAtomicShortcutForInput(
  shortcut: SectionShortcut["sequence"][number],
): string {
  return [...shortcut.modifiers.map(formatModifierForInput), shortcut.base].join(
    "+",
  );
}

function formatModifierForInput(modifier: Modifiers): string {
  switch (modifier) {
    case Modifiers.control:
      return "ctrl";
    case Modifiers.shift:
      return "shift";
    case Modifiers.option:
      return "opt";
    case Modifiers.command:
      return "cmd";
    case Modifiers.win:
      return "win";
  }
}

const baseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
]);
