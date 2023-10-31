import { parseInputShortcuts } from "./input-parser";
import { InputApp } from "../model/input/input-models";
import { AppShortcuts, AtomicShortcut } from "../model/internal/internal-models";
import { Modifiers } from "../model/internal/modifiers";

describe("Parses shortcut correctly", () => {
    it("Parses app shortcut", () => {
        expect(parseInputShortcuts([generateInputAppWithShortcut()])).toEqual([generateExpectedAppWithShortcut()]);
    });

    it("Parses shortcut without modifiers", () => {
        const expectedShortcutSequence = [
            {
                base: "e",
                modifiers: [],
            },
        ];

        expect(parseInputShortcuts([generateInputAppWithShortcut({ shortcut: "e" })])).toEqual([
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
        keymaps: [
            {
                title: "keymap-name",
                sections: [
                    {
                        title: "section-name",
                        shortcuts: [
                            {
                                title: "shortcut",
                                key: override?.shortcut ?? "cmd+e",
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

function generateExpectedAppWithShortcut(override?: { shortcutSequence: AtomicShortcut[] }): AppShortcuts {
    return {
        bundleId: "some-bundle-id",
        name: "some-name",
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
                                        modifiers: [Modifiers.command],
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
