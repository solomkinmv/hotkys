"use client";

import {
  AppShortcuts,
  Keymap,
} from "@/lib/model/internal/internal-models";
import { ShortcutDisplay } from "@/components/ui/shortcut-display";
import {
  modifierMapping,
  modifierSymbols,
} from "@/lib/model/internal/modifiers";
import { SeparatorWithText } from "@/components/ui/separator-with-text";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { Header1 } from "@/components/ui/typography";
import Fuse from "fuse.js";
import { KeymapSelector } from "@/app/apps/[slug]/[keymap]/keymap-selector";
import TableOfContents from "@/app/apps/[slug]/[keymap]/table-of-contents";
import Link from "next/link";
import { getPlatformDisplay } from "@/lib/utils";
import { AppIcon } from "@/components/ui/app-icon";
import { ListItem } from "@/components/ui/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MasonryGrid } from "@/components/ui/masonry-grid";

type ViewMode = "list" | "cheatsheet";

const VIEW_MODE_STORAGE_KEY = "shortcuts-view-mode";
const COLUMN_COUNT_STORAGE_KEY = "shortcuts-column-count";
const DEFAULT_COLUMNS = 4;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 6;
const MIN_COLUMN_WIDTH = 288;

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlViewMode = parseViewMode(searchParams.get("view"));
  const urlColumnCount = parseColumnCount(searchParams.get("cols"));

  const [viewMode, setViewModeState] = useState<ViewMode>("list");
  const [userColumnCount, setUserColumnCountState] = useState<number>(DEFAULT_COLUMNS);
  const [maxColumns, setMaxColumns] = useState<number>(MAX_COLUMNS);

  const effectiveColumnCount = Math.min(userColumnCount, maxColumns);

  useEffect(() => {
    const effectiveMode = urlViewMode ?? getStoredViewMode();
    setViewModeState(effectiveMode);
  }, [urlViewMode]);

  useEffect(() => {
    const effectiveCols = urlColumnCount ?? getStoredColumnCount();
    setUserColumnCountState(effectiveCols);
  }, [urlColumnCount]);

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

    const params = new URLSearchParams(searchParams.toString());
    if (newCount === DEFAULT_COLUMNS) {
      params.delete("cols");
    } else {
      params.set("cols", String(newCount));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const [searchResults, setSearchResults] = useState(keymap.sections);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalItems = searchResults.reduce(
    (sum, section) => sum + section.hotkeys.length,
    0,
  );

  const hotkeys = keymap.sections.flatMap((section) =>
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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      const results = fuse.search(event.target.value);
      const resultTitles = results.map((result) => result.item.title);
      const filteredSections = keymap.sections
        .map((section) => {
          const filteredHotkeys = section.hotkeys.filter((hotkey) =>
            resultTitles.includes(hotkey.title),
          );
          return { ...section, hotkeys: filteredHotkeys };
        })
        .filter((section) => section.hotkeys.length > 0);
      setSearchResults(filteredSections);
    } else {
      setSearchResults(keymap.sections);
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
  const appDetails = searchResults.map((section) => {
    sectionRefs.current[section.title] = React.createRef();
    return (
      <div
        id={section.title}
        key={section.title}
        ref={sectionRefs.current[section.title]}
      >
        <SeparatorWithText>{section.title}</SeparatorWithText>
        {section.hotkeys.map((hotkey) => {
          const currentIndex = globalIndex++;
          return (
            <ListItem
              key={hotkey.title + currentIndex}
              selected={selectedIndex === currentIndex}
              ref={(el) => {
                itemRefs.current[currentIndex] = el;
              }}
            >
              <span className="font-medium inline-flex items-center gap-2">
                <span>{hotkey.title}</span>
                <ShortcutDisplay shortcut={hotkey} />
              </span>
              <span className="text-right text-muted-foreground">
                {generateCommentText(hotkey.comment)}
              </span>
            </ListItem>
          );
        })}
      </div>
    );
  });

  const cheatsheetView = (
    <MasonryGrid
      items={searchResults}
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
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.hotkeys.map((hotkey, idx) => (
                <div
                  key={hotkey.title + idx}
                  className="flex items-start justify-between gap-2 text-sm py-1"
                >
                  <div className="flex flex-col min-w-0">
                    <span>{hotkey.title}</span>
                    {hotkey.comment && (
                      <span className="text-xs text-muted-foreground">
                        {generateCommentText(hotkey.comment)}
                      </span>
                    )}
                  </div>
                  <ShortcutDisplay shortcut={hotkey} className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <AppIcon icon={application.icon} appName={application.name} size="md" />
            <Header1 className="mb-0">{application.name}</Header1>
            {keymap.platforms?.map((platform) => (
              <Badge
                key={platform}
                variant="outline"
                className="text-sm"
                aria-label={`Platform: ${getPlatformDisplay(platform)}`}
              >
                {getPlatformDisplay(platform)}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <KeymapSelector
              keymaps={application.keymaps}
              activeKeymap={keymap.title}
              urlPrefix={`/apps/${application.slug}`}
            />
            <div className="flex items-center gap-1">
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
                        <label className="text-sm font-medium">Columns</label>
                        <span className="text-sm text-muted-foreground">{effectiveColumnCount}</span>
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
        <div className="mx-auto max-w-5xl flex">
          <div className="grid gap-4 px-4 md:w-56 md:gap-6 shrink-0">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <TableOfContents
                  sections={keymap.sections}
                  sectionRefs={sectionRefs}
                />
              </div>
            </div>
          </div>
          <div className="border-l flex-1 px-4 md:px-6 pb-6">{appDetails}</div>
        </div>
      ) : (
        <div className="px-4 md:px-6 pb-6 mx-auto" style={{ maxWidth: `${effectiveColumnCount * 288 + (effectiveColumnCount - 1) * 16 + 48}px` }}>{cheatsheetView}</div>
      )}
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

const baseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
]);
