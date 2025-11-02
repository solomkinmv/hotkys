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

describe("Platform field preservation", () => {
    const parser = new ShortcutsParser();

    it("should preserve macOS platform", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut({platform: "macos"})]);
        expect(result[0].keymaps[0].platform).toBe("macos");
    });

    it("should preserve Windows platform", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut({platform: "windows"})]);
        expect(result[0].keymaps[0].platform).toBe("windows");
    });

    it("should preserve Linux platform", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut({platform: "linux"})]);
        expect(result[0].keymaps[0].platform).toBe("linux");
    });

    it("should handle missing platform field", () => {
        const result = parser.parseInputShortcuts([generateInputAppWithShortcut()]);
        expect(result[0].keymaps[0].platform).toBeUndefined();
    });
});

function generateInputAppWithShortcut(override?: {
    shortcut?: string;
    platform?: "windows" | "linux" | "macos";
}): InputApp {
    return {
        bundleId: "some-bundle-id",
        name: "some-name",
        slug: "slug",
        keymaps: [
            {
                title: "keymap-name",
                platform: override?.platform,
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
