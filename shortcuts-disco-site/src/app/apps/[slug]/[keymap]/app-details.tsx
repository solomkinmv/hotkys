"use client";

import {
  AppShortcuts,
  Keymap,
  Section,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import { serializeKeymap } from "@/lib/model/keymap-utils";
import { matchesFavorite } from "@/lib/shortcut-core/favorites";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";
import { ShortcutMethod } from "@/components/shortcuts/shortcut-method";
import { ShortcutFields } from "@/components/shortcuts/shortcut-fields";
import { Modifiers } from "@/lib/model/internal/modifiers";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import Fuse from "fuse.js";
import { KeymapSelector } from "@/app/apps/[slug]/[keymap]/keymap-selector";
import TableOfContents from "@/app/apps/[slug]/[keymap]/table-of-contents";
import { ListItem } from "@/components/ui/list";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  Menu,
  Pencil,
  Plus,
  Settings2,
  Search,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import { customizationsService } from "@/lib/services/customizations-service";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeShortcutKey } from "@/lib/shortcut-key-format";
import {
  assertResourceLimit,
  USER_CONTENT_LIMITS,
} from "@/lib/validation/user-content";

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
      customSectionTitle: string;
    }
  | {
      type: "override";
      customizationId?: string;
      sectionTitle: string;
      shortcutTitle: string;
      baseShortcutId?: string;
    }
  | {
      type: "custom";
      shortcutId: string;
      shortcutTitle: string;
    };
type ShortcutDraft = {
  title: string;
  key: string;
  comment: string;
};
type DeleteShortcutDialogState = {
  id: string;
  title: string;
};

const VIEW_MODE_STORAGE_KEY = "shortcuts-view-mode";
const COLUMN_COUNT_STORAGE_KEY = "shortcuts-column-count";
const FAVORITE_SHORTCUTS_SECTION_TITLE = "Favorite shortcuts";
const DEFAULT_COLUMNS = 4;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 6;
const MIN_COLUMN_WIDTH = 288;
const NEW_SECTION_VALUE = "__new_section__";
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
  const { customizations, refetch: refetchCustomizations } =
    useCustomizations();
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
        customizations,
      )[0] ?? application
    );
  }, [application, customizations, user]);
  const customKeymapId = searchParams.get("keymap");
  const displayKeymap = useMemo(
    () =>
      mergedApplication.keymaps.find((mergedKeymap) =>
        customKeymapId
          ? mergedKeymap.customKeymapId === customKeymapId
          : mergedKeymap.title === keymap.title,
      ) ?? keymap,
    [keymap, mergedApplication, customKeymapId],
  );

  const [viewMode, setViewModeState] = useState<ViewMode>("list");
  const [userColumnCount, setUserColumnCountState] =
    useState<number>(DEFAULT_COLUMNS);
  const [maxColumns, setMaxColumns] = useState<number>(MAX_COLUMNS);
  const cheatsheetContainerRef = useRef<HTMLDivElement>(null);
  const [shortcutDialog, setShortcutDialog] =
    useState<ShortcutDialogState | null>(null);
  const [deleteShortcutDialog, setDeleteShortcutDialog] =
    useState<DeleteShortcutDialogState | null>(null);
  const [shortcutDraft, setShortcutDraft] =
    useState<ShortcutDraft>(emptyShortcutDraft);
  const [shortcutDialogError, setShortcutDialogError] = useState<string | null>(
    null,
  );
  const [deleteShortcutError, setDeleteShortcutError] = useState<string | null>(
    null,
  );
  const [isSavingShortcut, setIsSavingShortcut] = useState(false);
  const [isDeletingShortcut, setIsDeletingShortcut] = useState(false);

  const effectiveColumnCount = Math.min(userColumnCount, maxColumns);

  useEffect(() => {
    const effectiveMode =
      urlViewMode ??
      (user && !preferencesLoading
        ? preferences.viewMode
        : getStoredViewMode());
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
      const availableWidth = cheatsheetContainerRef.current?.clientWidth ?? 0;
      if (!availableWidth) return;
      const gap = 16;
      const max = Math.max(
        1,
        Math.floor((availableWidth + gap) / (MIN_COLUMN_WIDTH + gap)),
      );
      setMaxColumns(Math.min(MAX_COLUMNS, max));
    };

    updateMaxColumns();
    const observer = new ResizeObserver(updateMaxColumns);
    if (cheatsheetContainerRef.current)
      observer.observe(cheatsheetContainerRef.current);

    return () => observer.disconnect();
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
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
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
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [sectionSheetOpen, setSectionSheetOpen] = useState(false);

  useEffect(() => {
    setSearchTerm("");
  }, [displayKeymap]);

  const searchResults = useMemo<DisplaySection[]>(() => {
    if (!searchTerm.trim()) return displayKeymap.sections;
    const fuse = new Fuse(
      displayKeymap.sections.flatMap((section) => section.hotkeys),
      {
        keys: ["title"],
        includeScore: true,
      },
    );
    const titles = new Set(
      fuse.search(searchTerm.trim()).map((result) => result.item.title),
    );
    return displayKeymap.sections
      .map((section) => ({
        ...section,
        hotkeys: section.hotkeys.filter((hotkey) => titles.has(hotkey.title)),
      }))
      .filter((section) => section.hotkeys.length > 0);
  }, [displayKeymap, searchTerm]);
  const shortcutCount = displayKeymap.sections.reduce(
    (total, section) => total + section.hotkeys.length,
    0,
  );
  const resultCount = searchResults.reduce(
    (total, section) => total + section.hotkeys.length,
    0,
  );

  const favoriteShortcutItems = user
    ? searchResults.flatMap((section) =>
        section.hotkeys
          .filter((shortcut) =>
            favorites.some((favorite) =>
              matchesFavorite(favorite, {
                itemType: "shortcut",
                appSlug: mergedApplication.slug,
                keymapTitle: displayKeymap.title,
                customKeymapId: displayKeymap.customKeymapId,
                sectionTitle: shortcut.baseSectionTitle ?? section.title,
                shortcutTitle: shortcut.baseShortcutTitle ?? shortcut.title,
                baseShortcutId: shortcut.baseShortcutId,
                baseShortcutAliases: shortcut.baseShortcutAliases,
                customShortcutId: shortcut.customShortcutId,
              }),
            ),
          )
          .map((shortcut) => ({ sectionTitle: section.title, shortcut })),
      )
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
  const defaultAddShortcutSectionTitle =
    searchResults[0]?.title ??
    displayKeymap.sections[0]?.title ??
    NEW_SECTION_VALUE;

  const totalItems = displaySections.reduce(
    (sum, section) => sum + section.hotkeys.length,
    0,
  );

  const isOfficialShortcut = (sectionTitle: string, shortcutTitle: string) =>
    keymap.sections.some(
      (section) =>
        section.title === sectionTitle &&
        section.hotkeys.some((hotkey) => hotkey.title === shortcutTitle),
    );

  const openAddShortcutDialog = (sectionTitle: string) => {
    setShortcutDialog({
      type: "add",
      sectionTitle,
      customSectionTitle: "",
    });
    setShortcutDraft(emptyShortcutDraft);
    setShortcutDialogError(null);
  };

  const openOverrideShortcutDialog = (
    sectionTitle: string,
    shortcut: SectionShortcut,
  ) => {
    setShortcutDialog({
      type: "override",
      customizationId: shortcut.customizationId,
      sectionTitle,
      shortcutTitle: shortcut.baseShortcutTitle ?? shortcut.title,
      baseShortcutId: shortcut.baseShortcutId,
    });
    setShortcutDraft({
      title: shortcut.title,
      key: formatShortcutForInput(shortcut),
      comment: shortcut.comment ?? "",
    });
    setShortcutDialogError(null);
  };

  const openCustomShortcutDialog = (shortcut: SectionShortcut) => {
    if (!shortcut.customizationId) return;

    setShortcutDialog({
      type: "custom",
      shortcutId: shortcut.customizationId,
      shortcutTitle: shortcut.title,
    });
    setShortcutDraft({
      title: shortcut.title,
      key: formatShortcutForInput(shortcut),
      comment: shortcut.comment ?? "",
    });
    setShortcutDialogError(null);
  };

  const openDeleteShortcutDialog = (shortcut: DeleteShortcutDialogState) => {
    setDeleteShortcutDialog(shortcut);
    setDeleteShortcutError(null);
  };

  const closeShortcutDialog = () => {
    setShortcutDialog(null);
    setShortcutDraft(emptyShortcutDraft);
    setShortcutDialogError(null);
  };

  const closeDeleteShortcutDialog = () => {
    setDeleteShortcutDialog(null);
    setDeleteShortcutError(null);
  };

  const handleSaveShortcutDialog = async () => {
    if (!user || !shortcutDialog) return;

    const title = shortcutDraft.title.trim();
    const key = shortcutDraft.key.trim()
      ? normalizeShortcutKey(shortcutDraft.key)
      : undefined;
    const comment = shortcutDraft.comment.trim() || undefined;
    const addSectionTitle =
      shortcutDialog.type === "add"
        ? shortcutDialog.sectionTitle === NEW_SECTION_VALUE
          ? shortcutDialog.customSectionTitle.trim()
          : shortcutDialog.sectionTitle
        : undefined;
    if (!title) {
      setShortcutDialogError("Shortcut title is required.");
      return;
    }
    if (shortcutDialog.type === "add" && !addSectionTitle) {
      setShortcutDialogError("Section name is required.");
      return;
    }

    if (shortcutDialog.type === "override") {
      const original = keymap.sections
        .find((section) => section.title === shortcutDialog.sectionTitle)
        ?.hotkeys.find(
          (hotkey) => hotkey.title === shortcutDialog.shortcutTitle,
        );
      if (
        process.env.NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING !== "true" &&
        ((!key && original?.sequence.length) || (!comment && original?.comment))
      ) {
        setShortcutDialogError(
          "Clearing original fields is not available yet. Restore the field or use Restore Original.",
        );
        return;
      }
      if (
        process.env.NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING === "true" &&
        !key &&
        !comment
      ) {
        setShortcutDialogError(
          "Keep a key or instructions, or delete the shortcut.",
        );
        return;
      }
    }

    setIsSavingShortcut(true);
    setShortcutDialogError(null);
    try {
      if (shortcutDialog.type === "add") {
        const customShortcutCount =
          customizations.shortcuts.length +
          [
            ...customizations.customKeymaps,
            ...customizations.customApps.flatMap((app) => app.keymaps),
          ].reduce(
            (count, customKeymap) =>
              count +
              customKeymap.sections.reduce(
                (sectionCount, section) =>
                  sectionCount + section.shortcuts.length,
                0,
              ),
            0,
          );
        assertResourceLimit(
          customShortcutCount,
          USER_CONTENT_LIMITS.customShortcuts,
          "custom shortcuts",
        );
        const sectionTitle = addSectionTitle;
        if (!sectionTitle) return;

        await customizationsService.createBaseAppShortcut(
          {
            baseAppSlug: application.slug,
            keymapTitle: displayKeymap.title,
            sectionTitle,
            title,
            key,
            comment,
          },
          user,
        );
      } else if (shortcutDialog.type === "override") {
        await customizationsService.upsertShortcutOverlay(
          {
            baseAppSlug: application.slug,
            baseKeymapTitle: keymap.title,
            baseSectionTitle: shortcutDialog.sectionTitle,
            baseShortcutTitle: shortcutDialog.shortcutTitle,
            baseShortcutId: shortcutDialog.baseShortcutId,
            ...(shortcutDialog.customizationId
              ? { id: shortcutDialog.customizationId }
              : {}),
            ...(process.env.NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING === "true"
              ? { keyIsCleared: !key, commentIsCleared: !comment }
              : {}),
            title,
            key,
            comment,
            isDeleted: false,
            sortOrder: 0,
          },
          user,
        );
      } else {
        await customizationsService.updateCustomShortcut(
          shortcutDialog.shortcutId,
          {
            title,
            key,
            comment,
          },
          user,
        );
      }
      closeShortcutDialog();
      await refetchCustomizations();
    } catch (error) {
      setShortcutDialogError(
        error instanceof Error ? error.message : "Unable to save shortcut.",
      );
    } finally {
      setIsSavingShortcut(false);
    }
  };

  const handleDeleteShortcutDialog = async () => {
    if (!user || !deleteShortcutDialog) return;

    setIsDeletingShortcut(true);
    setDeleteShortcutError(null);
    try {
      await customizationsService.deleteCustomShortcut(
        deleteShortcutDialog.id,
        user,
      );
      closeDeleteShortcutDialog();
      await refetchCustomizations();
    } catch (error) {
      setDeleteShortcutError(
        error instanceof Error ? error.message : "Unable to delete shortcut.",
      );
    } finally {
      setIsDeletingShortcut(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedIndex(-1);
  };

  const navigationItems = displaySections.flatMap((section) =>
    section.hotkeys.map((shortcut) => ({
      section: shortcut.baseSectionTitle ?? section.title,
      shortcut,
    })),
  );
  const { selectedIndex, setSelectedIndex, itemRefs } = useKeyboardNavigation(
    navigationItems,
    (item) => {
      if (!user) return;
      if (item.shortcut.customizationStatus === "created")
        openCustomShortcutDialog(item.shortcut);
      else openOverrideShortcutDialog(item.section, item.shortcut);
    },
    undefined,
    {
      enabled: !shortcutDialog && !deleteShortcutDialog && viewMode === "list",
      resetKey: JSON.stringify(
        navigationItems.map((item) => [
          item.section,
          item.shortcut.baseShortcutId,
          item.shortcut.customizationId,
          item.shortcut.title,
        ]),
      ),
    },
  );

  const sectionRefs = useRef<
    Record<string, React.RefObject<HTMLDivElement | null>>
  >({});
  let globalIndex = 0;
  const appDetails = displaySections.map((section) => {
    sectionRefs.current[section.title] ??= React.createRef();
    return (
      <div
        id={section.title}
        key={section.title}
        ref={sectionRefs.current[section.title]}
        className="scroll-mt-8 rounded-2xl border bg-card p-2"
      >
        <div className="mb-2 flex items-center justify-between gap-4 px-4 py-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {section.title}
          </h2>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {section.hotkeys.length}
          </span>
        </div>
        {section.hotkeys.map((hotkey) => {
          const currentIndex = globalIndex++;
          const favoriteSectionTitle =
            hotkey.favoriteSourceSectionTitle ?? section.title;
          const baseSectionTitle =
            hotkey.baseSectionTitle ?? favoriteSectionTitle;
          const baseShortcutTitle = hotkey.baseShortcutTitle ?? hotkey.title;
          const canOverride =
            user &&
            hotkey.customizationStatus !== "created" &&
            isOfficialShortcut(baseSectionTitle, baseShortcutTitle);
          const canEditCustom =
            user &&
            hotkey.customizationStatus === "created" &&
            Boolean(hotkey.customizationId);
          const canCustomize = Boolean(canOverride || canEditCustom);
          const openShortcutDialog = () => {
            if (canEditCustom) {
              openCustomShortcutDialog(hotkey);
            } else if (canOverride) {
              openOverrideShortcutDialog(baseSectionTitle, hotkey);
            }
          };
          return (
            <ListItem
              key={hotkey.title + currentIndex}
              selected={selectedIndex === currentIndex}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-2 rounded-xl border-0 px-4 py-3 text-sm odd:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center",
                !canCustomize && "cursor-default",
              )}
              onClick={canCustomize ? openShortcutDialog : undefined}
              ref={(el) => {
                itemRefs.current[currentIndex] = el;
              }}
            >
              <span className="col-start-1 row-start-1 min-w-0">
                {canCustomize ? (
                  <button
                    type="button"
                    className="rounded-sm text-left font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:underline"
                    onClick={(event) => {
                      event.stopPropagation();
                      openShortcutDialog();
                    }}
                  >
                    {hotkey.title}
                  </button>
                ) : (
                  <span>{hotkey.title}</span>
                )}
              </span>
              <ShortcutMethod
                shortcut={hotkey}
                className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
              />
              <span className="col-start-2 row-start-1 flex items-center justify-end gap-2 sm:col-start-3">
                <ShortcutStatusIndicator shortcut={hotkey} />
                <FavoriteButton
                  itemType="shortcut"
                  appSlug={application.slug}
                  keymapTitle={displayKeymap.title}
                  sectionTitle={favoriteSectionTitle}
                  shortcutTitle={hotkey.baseShortcutTitle ?? hotkey.title}
                  baseShortcutId={hotkey.baseShortcutId}
                  baseShortcutAliases={hotkey.baseShortcutAliases}
                  customShortcutId={hotkey.customShortcutId}
                  className="shrink-0 text-muted-foreground"
                />
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
      columnWidth="w-72 min-w-0 max-w-full"
      getItemHeight={(section) => section.hotkeys.length + 1}
      renderItem={(section) => {
        sectionRefs.current[section.title] ??= React.createRef();
        return (
          <div
            id={section.title}
            ref={sectionRefs.current[section.title]}
            className="scroll-mt-8 rounded-2xl border bg-card p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold tracking-tight">{section.title}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {section.hotkeys.length}
              </span>
            </div>
            <div className="space-y-4">
              {section.hotkeys.map((hotkey, idx) => {
                const favoriteSectionTitle =
                  hotkey.favoriteSourceSectionTitle ?? section.title;
                const baseSectionTitle =
                  hotkey.baseSectionTitle ?? favoriteSectionTitle;
                const baseShortcutTitle =
                  hotkey.baseShortcutTitle ?? hotkey.title;
                const canOverride =
                  user &&
                  hotkey.customizationStatus !== "created" &&
                  isOfficialShortcut(baseSectionTitle, baseShortcutTitle);
                const canEditCustom =
                  user &&
                  hotkey.customizationStatus === "created" &&
                  Boolean(hotkey.customizationId);
                const canCustomize = Boolean(canOverride || canEditCustom);
                const openShortcutDialog = () => {
                  if (canEditCustom) {
                    openCustomShortcutDialog(hotkey);
                  } else if (canOverride) {
                    openOverrideShortcutDialog(baseSectionTitle, hotkey);
                  }
                };
                return (
                  <div
                    key={hotkey.title + idx}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 text-sm"
                    onClick={canCustomize ? openShortcutDialog : undefined}
                  >
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1">
                        {canCustomize ? (
                          <button
                            type="button"
                            className="rounded-sm text-left font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:underline"
                            onClick={(event) => {
                              event.stopPropagation();
                              openShortcutDialog();
                            }}
                          >
                            {hotkey.title}
                          </button>
                        ) : (
                          <span>{hotkey.title}</span>
                        )}
                      </span>
                    </div>
                    <ShortcutMethod
                      shortcut={hotkey}
                      compact
                      className="col-span-2 row-start-2"
                    />
                    <div className="col-start-2 row-start-1 flex items-center gap-1.5">
                      <ShortcutStatusIndicator shortcut={hotkey} />
                      <FavoriteButton
                        itemType="shortcut"
                        appSlug={application.slug}
                        keymapTitle={displayKeymap.title}
                        sectionTitle={favoriteSectionTitle}
                        shortcutTitle={hotkey.baseShortcutTitle ?? hotkey.title}
                        baseShortcutId={hotkey.baseShortcutId}
                        baseShortcutAliases={hotkey.baseShortcutAliases}
                        customShortcutId={hotkey.customShortcutId}
                        className="shrink-0 text-muted-foreground"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    />
  );

  const emptySearchState = (
    <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
      <Search
        className="mx-auto mb-4 size-6 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="text-lg font-semibold tracking-tight">
        {searchTerm.trim() ? "No shortcuts found" : "No shortcuts yet"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchTerm.trim()
          ? "Try another action name or clear your search."
          : "This keymap doesn't have any shortcuts yet."}
      </p>
      {searchTerm.trim() && (
        <Button
          variant="outline"
          className="mt-5 rounded-xl"
          onClick={() => {
            setSearchTerm("");
            setSelectedIndex(-1);
          }}
        >
          Clear search
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="mb-8 rounded-2xl border bg-muted/40 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div
            role="search"
            aria-label="Search shortcuts"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <SearchBar
                value={searchTerm}
                onChange={handleSearch}
                placeholder={`Search ${application.name} shortcuts…`}
                className="h-12 rounded-xl bg-card text-base shadow-xs"
              />
            </div>
            {user && defaultAddShortcutSectionTitle && (
              <Button
                variant="secondary"
                className="h-12 shrink-0 gap-1.5 rounded-xl"
                onClick={() =>
                  openAddShortcutDialog(defaultAddShortcutSectionTitle)
                }
                aria-label="Add shortcut"
              >
                <Plus className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Add shortcut</span>
              </Button>
            )}
          </div>
          <KeymapSelector
            keymaps={mergedApplication.keymaps}
            baseKeymap={serializeKeymap(keymap)}
            activeKeymap={displayKeymap.title}
            urlPrefix={`/apps/${application.slug}`}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            aria-live="polite"
            className="font-mono text-xs text-muted-foreground"
          >
            {searchTerm.trim()
              ? `${resultCount} matching ${resultCount === 1 ? "shortcut" : "shortcuts"}`
              : `${shortcutCount} ${shortcutCount === 1 ? "shortcut" : "shortcuts"} / ${displayKeymap.sections.length} ${displayKeymap.sections.length === 1 ? "section" : "sections"}`}
          </p>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
            {viewMode === "list" && (
              <Button
                variant="outline"
                size="sm"
                className="size-9 shrink-0 rounded-xl px-0 sm:w-auto sm:px-3 md:hidden"
                onClick={() => setSectionSheetOpen(true)}
              >
                <Menu className="size-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sections</span>
              </Button>
            )}
            <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 rounded-lg px-2.5 aria-pressed:text-brand"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <List className="size-3.5" aria-hidden="true" /> List
              </Button>
              <Button
                variant={viewMode === "cheatsheet" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 rounded-lg px-2.5 aria-pressed:text-brand"
                onClick={() => setViewMode("cheatsheet")}
                aria-label="Cheat sheet view"
                aria-pressed={viewMode === "cheatsheet"}
              >
                <LayoutGrid className="size-3.5" aria-hidden="true" /> Cheat
                sheet
              </Button>
              {viewMode === "cheatsheet" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg"
                      aria-label="Column settings"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 rounded-xl" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <TypographySmall>Columns</TypographySmall>
                        <TypographyMuted>
                          {effectiveColumnCount}
                        </TypographyMuted>
                      </div>
                      <Slider
                        aria-label="Cheat sheet columns"
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
        </div>
      </div>
      {viewMode === "list" ? (
        <>
          <Sheet open={sectionSheetOpen} onOpenChange={setSectionSheetOpen}>
            <SheetContent
              side="left"
              className="w-64 overflow-y-auto p-6 pt-12"
            >
              <SheetTitle className="sr-only">Sections</SheetTitle>
              <TableOfContents
                sections={displaySections}
                sectionRefs={sectionRefs}
                onSectionClick={() => setSectionSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
          {resultCount === 0 ? (
            emptySearchState
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
              <div className="hidden min-w-0 md:block">
                <TableOfContents
                  sections={displaySections}
                  sectionRefs={sectionRefs}
                />
              </div>
              <div className="min-w-0 space-y-5">{appDetails}</div>
            </div>
          )}
        </>
      ) : (
        <div
          ref={cheatsheetContainerRef}
          data-columns={effectiveColumnCount}
          className="w-full min-w-0"
        >
          {resultCount === 0 ? emptySearchState : cheatsheetView}
        </div>
      )}
      <Dialog
        open={shortcutDialog !== null}
        onOpenChange={(open) => {
          if (!open) closeShortcutDialog();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {shortcutDialog?.type === "add"
                ? "Add Shortcut"
                : "Customize Shortcut"}
            </DialogTitle>
            <DialogDescription>
              {shortcutDialog?.type === "add"
                ? "Save a shortcut for your account. It will appear alongside this app’s shortcuts."
                : "Customize this shortcut for your account."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-5 py-2">
            {shortcutDialog?.type === "add" && (
              <div
                role="group"
                aria-label="Section"
                className={cn(
                  "grid gap-4",
                  shortcutDialog.sectionTitle === NEW_SECTION_VALUE &&
                    "sm:grid-cols-2 sm:items-end",
                )}
              >
                <Field>
                  <FieldLabel htmlFor="shortcut-section">Section</FieldLabel>
                  <Select
                    value={shortcutDialog.sectionTitle}
                    onValueChange={(value) =>
                      setShortcutDialog((dialog) =>
                        dialog?.type === "add"
                          ? {
                              ...dialog,
                              sectionTitle: value,
                            }
                          : dialog,
                      )
                    }
                  >
                    <SelectTrigger
                      id="shortcut-section"
                      aria-label="Section"
                      className="w-full min-w-0 [&_[data-slot=select-value]]:truncate"
                    >
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {displayKeymap.sections.map((section) => (
                          <SelectItem key={section.title} value={section.title}>
                            {section.title}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_SECTION_VALUE}>
                          New section...
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                {shortcutDialog.sectionTitle === NEW_SECTION_VALUE && (
                  <Field>
                    <FieldLabel htmlFor="shortcut-section-name">
                      Section name
                    </FieldLabel>
                    <Input
                      id="shortcut-section-name"
                      value={shortcutDialog.customSectionTitle}
                      maxLength={USER_CONTENT_LIMITS.sectionTitle}
                      onChange={(event) =>
                        setShortcutDialog((dialog) =>
                          dialog?.type === "add"
                            ? {
                                ...dialog,
                                customSectionTitle: event.target.value,
                              }
                            : dialog,
                        )
                      }
                    />
                  </Field>
                )}
              </div>
            )}
            <ShortcutFields
              draft={shortcutDraft}
              onChange={(updates) =>
                setShortcutDraft((draft) => ({ ...draft, ...updates }))
              }
            />
            {shortcutDialogError && (
              <FieldError>{shortcutDialogError}</FieldError>
            )}
          </FieldGroup>
          <DialogFooter className="sm:justify-between">
            {shortcutDialog?.type === "custom" && (
              <Button
                variant="destructive"
                onClick={() => {
                  openDeleteShortcutDialog({
                    id: shortcutDialog.shortcutId,
                    title:
                      shortcutDraft.title.trim() ||
                      shortcutDialog.shortcutTitle,
                  });
                  closeShortcutDialog();
                }}
                aria-label="Delete shortcut"
              >
                Delete
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeShortcutDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveShortcutDialog}
                disabled={isSavingShortcut}
              >
                {isSavingShortcut ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteShortcutDialog !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteShortcutDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shortcut</DialogTitle>
            <DialogDescription>
              Delete &quot;{deleteShortcutDialog?.title}&quot; from your custom
              shortcuts.
            </DialogDescription>
          </DialogHeader>
          {deleteShortcutError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteShortcutError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteShortcutDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteShortcutDialog}
              disabled={isDeletingShortcut}
            >
              {isDeletingShortcut ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ShortcutStatusIndicator({ shortcut }: { shortcut: SectionShortcut }) {
  if (!shortcut.customizationStatus) return null;

  const label =
    shortcut.customizationStatus === "created"
      ? "Custom shortcut"
      : "Edited shortcut";
  const Icon = shortcut.customizationStatus === "created" ? Plus : Pencil;

  return (
    <span
      aria-label={label}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground/75"
      data-customization-status={shortcut.customizationStatus}
      title={label}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
    </span>
  );
}

function formatShortcutForInput(shortcut: SectionShortcut): string {
  return shortcut.sequence.map(formatAtomicShortcutForInput).join(" ");
}

function formatAtomicShortcutForInput(
  shortcut: SectionShortcut["sequence"][number],
): string {
  return [
    ...shortcut.modifiers.map(formatModifierForInput),
    shortcut.base,
  ].join("+");
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
