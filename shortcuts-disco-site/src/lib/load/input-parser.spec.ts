import {ShortcutsParser} from "./input-parser";
import {InputApp} from "@/lib/model/input/input-models";
import {AppShortcuts, AtomicShortcut} from "@/lib/model/internal/internal-models";
import {Modifiers} from "@/lib/model/internal/modifiers";
import { describe, expect, it } from "@jest/globals";

describe("Parses shortcut correctly", () => {
    const parser = new ShortcutsParser();

    it("Parses app shortcut", () => {
        expect(parser.parseInputShortcuts([generateInputAppWithShortcut()])).toEqual([generateExpectedAppWithShortcut()]);
    });

    it("Parses shortcut without modifiers", () => {
        const expectedShortcutSequence: AtomicShortcut[] = [
            {
                base: "e",
                modifiers: [],
            },
        ];

        expect(parser.parseInputShortcuts([generateInputAppWithShortcut({shortcut: "e"})])).toEqual([
            generateExpectedAppWithShortcut({
                shortcutSequence: expectedShortcutSequence,
            }),
        ]);
    });

});

function generateInputAppWithShortcut(override?: { shortcut: string }): InputApp {
    return {
        bundleId: "some-bundle-id",
        name: "some-name",
        slug: "slug",
        keymaps: [
            {
                title: "keymap-name",
                sections: [
                    {
                        title: "section-name",
                        shortcuts: [
                            {
                                title: "shortcut",
                                key: override?.shortcut ?? "ctrl+e",
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

function generateExpectedAppWithShortcut(override?: {
    shortcutSequence?: AtomicShortcut[],
}): AppShortcuts {
    return {
        bundleId: "some-bundle-id",
        name: "some-name",
        slug: "slug",
        keymaps: [
            {
                title: "keymap-name",
                sections: [
                    {
                        title: "section-name",
                        hotkeys: [
                            {
                                title: "shortcut",
                                sequence: override?.shortcutSequence ?? [
                                    {
                                        base: "e",
                                        modifiers: [Modifiers.control],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
}
