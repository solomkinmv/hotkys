"use client";

import {AppShortcuts, Keymap, SectionShortcut} from "@/lib/model/internal/internal-models";
import {KeyboardBadge} from "@/components/ui/keyboard-badge";
import {modifierMapping, modifierSymbols} from "@/lib/model/internal/modifiers";
import {SeparatorWithText} from "@/components/ui/separator-with-text";
import React, {useRef, useState} from "react";
import {SearchBar} from "@/components/ui/search-bar";
import {Header1} from "@/components/ui/typography";
import Fuse from "fuse.js";
import {KeymapSelector} from "@/app/apps/[slug]/[keymap]/keymap-selector";
import TableOfContents from "@/app/apps/[slug]/[keymap]/table-of-contents";
import {ListItem} from "@/components/ui/list";
import Link from "next/link";
import {cn} from "@/lib/utils";

export const AppDetails = ({
                               application,
                               keymap
                           }: {
    application: AppShortcuts,
    keymap: Keymap
}) => {


    const [searchResults, setSearchResults] = useState(keymap.sections);


    const hotkeys = keymap.sections.flatMap(section =>
        section.hotkeys.map(hotkey => ({
            ...hotkey,
            sectionTitle: section.title
        })));

    const fuse = new Fuse(hotkeys, {
        keys: ["title"],
        includeScore: true,
        includeMatches: true,
    });

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value) {
            const results = fuse.search(event.target.value);
            const resultTitles = results.map(result => result.item.title);
            const filteredSections = keymap.sections.map(section => {
                const filteredHotkeys = section.hotkeys.filter(hotkey => resultTitles.includes(hotkey.title));
                return {...section, hotkeys: filteredHotkeys};
            }).filter(section => section.hotkeys.length > 0);
            setSearchResults(filteredSections);
        } else {
            setSearchResults(keymap.sections);
        }
    };

    const sectionRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
    const appDetails = searchResults.map((section) => {
        sectionRefs.current[section.title] = React.createRef();
        return (
            <div id={section.title} key={section.title} ref={sectionRefs.current[section.title]}>
                <SeparatorWithText>{section.title}</SeparatorWithText>
                {section.hotkeys.map((hotkey, idx) => (
                    <ListItem key={hotkey.title + idx}>
                        <span className="font-medium">
                            <span>{hotkey.title}</span>
                            {hotkey.sequence.length > 0 &&
                                <KeyboardBadge tokens={generateFormattedHotkeyTokens(hotkey)} className="ml-2"/>}
                        </span>
                        <span className="text-right text-gray-500">
                            {generateCommentText(hotkey.comment)}
                        </span>
                    </ListItem>
                ))}
            </div>
        );
    });

    return (
        <div className="flex min-h-0 w-full flex-1">
            <div className="grid gap-4 p-4 md:w-50 md:gap-6">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <KeymapSelector keymaps={application.keymaps} activeKeymap={keymap.title}
                                        urlPrefix={`/apps/${application.slug}`}/>
                        <TableOfContents sections={keymap.sections} sectionRefs={sectionRefs}/>
                    </div>
                </div>
            </div>
            <div className="grid min-h-0 flex-1 border-l">
                <div className="min-h-0 flex-1 p-4 md:p-6">
                    <Header1 className={cn(application.source && "mb-0")}>{application.name}</Header1>
                    {application.source &&
                        <Link href={application.source} className="text-sm text-gray-500 hover:underline">
                            Source
                        </Link>}
                    <SearchBar onChange={handleSearch}/>
                    {appDetails}
                </div>
            </div>
        </div>
    );
};

function generateFormattedHotkeyTokens(shortcut: SectionShortcut): string[] {
    return shortcut.sequence
        .flatMap((atomicShortcut) => {
            const modifiersText: string[] = atomicShortcut.modifiers.map((modifier) => modifierSymbols.get(modifier))
                .filter(value => value !== undefined) as string[];
            return [...modifiersText, overrideSymbolIfPossible(atomicShortcut.base), " "];
        });
}

function generateCommentText(optionalComment: string | undefined): string | undefined {
    if (optionalComment === undefined) {
        return undefined;
    }
    let comment = optionalComment;
    modifierMapping.forEach((modifier, text) => {
        comment = comment.replace("{" + text + "}", modifierSymbols.get(modifier) ?? "");
    });
    baseKeySymbolOverride.forEach((text, symbol) => {
        comment = comment.replace("{" + text + "}", symbol);
    });
    return comment;
}

function overrideSymbolIfPossible(base: string): string {
    if (baseKeySymbolOverride.has(base)) {
        return baseKeySymbolOverride.get(base) as string;
    }
    return base.toUpperCase();
}

const baseKeySymbolOverride: Map<string, string> = new Map([
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
]);

