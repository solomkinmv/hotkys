import {ShortcutsParser} from "./input-parser";
import {InputApp} from "@/lib/model/input/input-models";
import {AppShortcuts, AtomicShortcut, Platform} from "@/lib/model/internal/internal-models";
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

describe("Platform field preservation", () => {
    const parser = new ShortcutsParser();

    it("should preserve macOS platform", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut({platforms: ["macos"]})]);
        expect(result[0].keymaps[0].platforms).toEqual(["macos"]);
    });

    it("should preserve Windows platform", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut({platforms: ["windows"]})]);
        expect(result[0].keymaps[0].platforms).toEqual(["windows"]);
    });

    it("should preserve Linux platform", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut({platforms: ["linux"]})]);
        expect(result[0].keymaps[0].platforms).toEqual(["linux"]);
    });

    it("should handle missing platforms field", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut()]);
        expect(result[0].keymaps[0].platforms).toBeUndefined();
    });
});

function generateInputAppWithShortcut(override?: {
    shortcut?: string;
    platforms?: Platform[];
}): InputApp {
    return {
        bundleId: "some-bundle-id",
        name: "some-name",
        slug: "slug",
        keymaps: [
            {
                title: "keymap-name",
                platforms: override?.platforms,
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
