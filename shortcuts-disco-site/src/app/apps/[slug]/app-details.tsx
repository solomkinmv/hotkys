"use client";

import {AppShortcuts, SectionShortcut} from "@/lib/model/internal/internal-models";
import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";
import {KeyboardBadge} from "@/components/ui/keyboard-badge";
import {modifierMapping, modifierSymbols} from "@/lib/model/internal/modifiers";
import {SeparatorWithText} from "@/components/ui/separator-with-text";
import TableOfContents from "@/app/apps/[slug]/table-of-contents";
import React, {useRef, useState} from "react";
import {SearchBar} from "@/components/ui/search-bar";
import {Header1} from "@/components/ui/typography";
import Fuse from "fuse.js";

export const AppDetails = ({
                               application,
                           }: {
    application: AppShortcuts;
}) => {


    const keymap = application.keymaps[0];
    const [searchResults, setSearchResults] = useState(keymap.sections);


    const hotkeys = keymap.sections.flatMap(section => section.hotkeys.map(hotkey => ({...hotkey, sectionTitle: section.title})));

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
                <Table>
                    <TableBody>
                        {section.hotkeys.map((hotkey, idx) => (
                            <TableRow key={hotkey.title + idx}>
                                <TableCell className="font-medium">
                                    {hotkey.title}
                                    <KeyboardBadge base={generateHotkeyText(hotkey)} className="ml-2"/>
                                </TableCell>
                                <TableCell className="text-gray-500 text-right">
                                    {generateCommentText(hotkey.comment)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    });

    return <section className="prose prose-gray max-w-3xl mx-auto dark:prose-invert">
        <div className="flex flex-1 min-h-0 w-full">
            <div className="grid gap-4 p-4 md:gap-6 md:w-50">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <TableOfContents sections={keymap.sections} sectionRefs={sectionRefs}/>
                    </div>
                </div>
            </div>
            <div className="flex-1 border-l grid min-h-0">
                <div className="flex-1 p-4 min-h-0 md:p-6">
                    <Header1>{application.name}</Header1>
                    <SearchBar onChange={handleSearch}/>
                    {appDetails}
                </div>
            </div>
        </div>
    </section>;
};

function generateHotkeyText(shortcut: SectionShortcut): string {
    return shortcut.sequence
        .map((atomicShortcut) => {
            const modifiersText = atomicShortcut.modifiers.map((modifier) => modifierSymbols.get(modifier)).join("") ?? "";
            return modifiersText + overrideSymbolIfPossible(atomicShortcut.base);
        })
        .join(" ");
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

function overrideSymbolIfPossible(base: string) {
    if (baseKeySymbolOverride.has(base)) {
        return baseKeySymbolOverride.get(base);
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

