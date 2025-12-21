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
import { ListItem } from "@/components/ui/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ViewMode = "list" | "cheatsheet";

const VIEW_MODE_STORAGE_KEY = "shortcuts-view-mode";

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

  const [viewMode, setViewModeState] = useState<ViewMode>("list");

  useEffect(() => {
    const effectiveMode = urlViewMode ?? getStoredViewMode();
    setViewModeState(effectiveMode);
  }, [urlViewMode]);

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
    <div className="flex flex-wrap gap-4 justify-center items-start">
      {searchResults.map((section) => {
        sectionRefs.current[section.title] = React.createRef();
        return (
          <div
            id={section.title}
            key={section.title}
            ref={sectionRefs.current[section.title]}
            className="border rounded-lg p-3 w-72"
          >
            <h3 className="font-semibold text-sm mb-2 text-muted-foreground">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.hotkeys.map((hotkey, idx) => (
                <div
                  key={hotkey.title + idx}
                  className="flex items-center justify-between gap-2 text-sm py-1"
                >
                  <span className="truncate">{hotkey.title}</span>
                  <ShortcutDisplay shortcut={hotkey} className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
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
        <div className="px-4 md:px-6 pb-6">{cheatsheetView}</div>
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
