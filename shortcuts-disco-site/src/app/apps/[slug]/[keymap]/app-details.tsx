"use client";

import {
  AppShortcuts,
  Keymap,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import { KeyboardBadge } from "@/components/ui/keyboard-badge";
import {
  modifierMapping,
  modifierSymbols,
  isWindows,
  isLinux,
} from "@/lib/model/internal/modifiers";
import { SeparatorWithText } from "@/components/ui/separator-with-text";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { Header1 } from "@/components/ui/typography";
import Fuse from "fuse.js";
import { KeymapSelector } from "@/app/apps/[slug]/[keymap]/keymap-selector";
import TableOfContents from "@/app/apps/[slug]/[keymap]/table-of-contents";
import Link from "next/link";
import { cn, getPlatformDisplay } from "@/lib/utils";
import { ListItem } from "@/components/ui/list";
import { Badge } from "@/components/ui/badge";

export const AppDetails = ({
  application,
  keymap,
}: {
  application: AppShortcuts;
  keymap: Keymap;
}) => {
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
              <span className="font-medium">
                <span>{hotkey.title}</span>
                <KeyboardBadge
                  base={generateHotkeyText(hotkey)}
                  className="ml-2"
                />
              </span>
              <span className="text-right text-gray-500">
                {generateCommentText(hotkey.comment)}
              </span>
            </ListItem>
          );
        })}
      </div>
    );
  });

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1">
      <div className="grid gap-4 p-4 md:w-56 md:gap-6">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <KeymapSelector
              keymaps={application.keymaps}
              activeKeymap={keymap.title}
              urlPrefix={`/apps/${application.slug}`}
            />
            <TableOfContents
              sections={keymap.sections}
              sectionRefs={sectionRefs}
            />
          </div>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 border-l overflow-y-auto">
        <div className="min-h-0 flex-1 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Header1 className={cn(application.source && "mb-0")}>
              {application.name}
            </Header1>
            {keymap.platform && (
              <Badge variant="outline" className="text-sm" aria-label={`Platform: ${getPlatformDisplay(keymap.platform)}`}>
                {getPlatformDisplay(keymap.platform)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {application.source && (
              <Link
                href={application.source}
                className="text-sm text-gray-500 hover:underline"
              >
                Source
              </Link>
            )}
          </div>
          <SearchBar onChange={handleSearch} />
          {appDetails}
        </div>
      </div>
    </div>
  );
};

function generateHotkeyText(shortcut: SectionShortcut): string {
  return shortcut.sequence
    .map((atomicShortcut) => {
      const modifiersText =
        atomicShortcut.modifiers
          .map((modifier) => modifierSymbols.get(modifier))
          .join("") ?? "";
      return modifiersText + overrideSymbolIfPossible(atomicShortcut.base);
    })
    .join(" ");
}

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
  baseKeySymbolOverride.forEach((text, symbol) => {
    comment = comment.replace("{" + text + "}", symbol);
  });
  return comment;
}

function overrideSymbolIfPossible(base: string) {
  if (baseKeySymbolOverride.has(base)) {
    return baseKeySymbolOverride.get(base);
  }
  return base.toUpperCase();
}

// macOS specific symbols
const macBaseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
  ["pageup", "PgUp"],
  ["pagedown", "PgDown"],
  ["home", "Home"],
  ["end", "End"],
  ["space", "Space"],
  ["capslock", "⇪"],
  ["backspace", "⌫"],
  ["tab", "⇥"],
  ["esc", "⎋"],
  ["enter", "↩"],
  ["cmd", "⌘"],
  ["ctrl", "⌃"],
  ["opt", "⌥"],
  ["shift", "⇧"],
  ["win", "⊞"],
]);

// Windows specific symbols
const winBaseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
  ["pageup", "PgUp"],
  ["pagedown", "PgDown"],
  ["home", "Home"],
  ["end", "End"],
  ["space", "Space"],
  ["capslock", "Caps"],
  ["backspace", "Backspace"],
  ["tab", "Tab"],
  ["esc", "Esc"],
  ["enter", "Enter"],
  ["cmd", "Ctrl"],
  ["ctrl", "Ctrl"],
  ["opt", "Alt"],
  ["shift", "Shift"],
  ["win", "Win"],
]);

// Linux specific symbols (similar to Windows but with Super instead of Win)
const linuxBaseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
  ["pageup", "PgUp"],
  ["pagedown", "PgDown"],
  ["home", "Home"],
  ["end", "End"],
  ["space", "Space"],
  ["capslock", "Caps"],
  ["backspace", "Backspace"],
  ["tab", "Tab"],
  ["esc", "Esc"],
  ["enter", "Enter"],
  ["cmd", "Ctrl"],
  ["ctrl", "Ctrl"],
  ["opt", "Alt"],
  ["shift", "Shift"],
  ["win", "Super"],
]);

// Use the appropriate symbols based on platform
const baseKeySymbolOverride: Map<string, string> = 
  isWindows ? winBaseKeySymbolOverride : 
  isLinux ? linuxBaseKeySymbolOverride : 
  macBaseKeySymbolOverride;
