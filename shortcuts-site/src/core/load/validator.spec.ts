import Validator, {ValidationError} from "./validator";
import {InputApp, InputKeymap} from "../model/input/input-models";
import {parseKeyCodes} from "../../../__tests__/helpers.spec";

const validator = new Validator(parseKeyCodes());

describe("Throws validation error", () => {

    describe("Throws validation error for shortcut key cases", () => {
        it.each([
            "abc+e",
            "Ctrl+e",
            "ctrl+SHIFT+a",
        ])("Throws validation error if incorrect modifier %p", (shortcut: string) => {
            expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
                new ValidationError(`Modifier doesn't exist: '${shortcut}'`),
            );
        });

        it.each([
            "cmd+💩",
            "cmd+",
            "cmd+e shift+abc",
            "cmd+e ctrl+",
            "cmd+E",
            "opt+x cmd+P",
        ])("Throw validation error if base key unknown %p", (shortcut: string) => {
            expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
                new ValidationError(`Unknown base key for shortcut: '${shortcut}'`),
            );
        });

        it("Throws validation error if there are whitespace in shortcut", () => {
            expect(() => validator.validate([generateInputAppWithShortcut({shortcut: "cmd+e +e"})])).toThrowError(
                new ValidationError("Invalid shortcut: 'cmd+e +e'"),
            );
        });

        it("Throws validation error if title longer than 50 characters", () => {
            const title = "some really really long text is here for longer tha";
            expect(() => validator.validate([generateInputAppWithShortcut({title})])).toThrowError(
                new ValidationError(`Title longer than 50 symbols: '${title}'`),
            );
        })

        it("Throws validation error if comment longer than 50 characters", () => {
            const comment = "some really really long text is here for longer tha";
            expect(() => validator.validate([generateInputAppWithShortcut({comment})])).toThrowError(
                new ValidationError(`Comment longer than 50 symbols: '${comment}'`),
            );
        })

        it.each([
            "opt+ctrl+e",
            "cmd+ctrl+e",
            "shift+ctrl+e",
            "opt+shift+e",
            "cmd+opt+e",
            "cmd+e shift+shift+a",
            "ctrl+shift+opt+cmd+e cmd+opt+e",
        ])("Throws validation error if modifiers are not in order %p", (shortcut: string) => {
            expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
                new ValidationError(`Modifiers have incorrect order. Received: '${shortcut}'. Correct order: ctrl, shift, opt, cmd`),
            );
        });

        it.each([
            "ctrl+ctrl"
        ])("Throws validation error if shortcut tokens are repeated %p", (shortcut: string) => {
            expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
                new ValidationError(`Shortcut tokens are repeated: '${shortcut}'`),
            );
        });

        it.each([
            "ctrl+shift+opt+cmd+e",
            "ctrl+opt+cmd+e",
            "shift+opt+e",
            "ctrl+shift+e",
            "opt+cmd+e",
            "ctrl+cmd+e",
            "ctrl+shift+opt+e",
            "ctrl+shift+cmd+e",
            "ctrl+opt+cmd+e",
            "shift+opt+cmd+e",
            "ctrl+shift+opt+cmd+e ctrl+opt+cmd+e shift+opt+e ctrl+shift+e opt+cmd+e ctrl+cmd+e ctrl+shift+opt+e ctrl+shift+cmd+e ctrl+opt+cmd+e shift+opt+cmd+e",
        ])("Validation succeed if modifiers are in order %p", (shortcut: string) => {
            expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).not.toThrowError();
        });
    });

    describe("Throws validation error for general structure cases", () => {
        it("Throws validation error if app bundle ids are not unique", () => {
            const appShortcuts = generateInputAppWithShortcut();
            expect(() => validator.validate([appShortcuts, appShortcuts])).toThrowError(
                new ValidationError(`Duplicated app bundleId found: '${appShortcuts.bundleId}'`),
            );
        });

        it("Throws validation error if app names are not unique", () => {
            const appShortcuts1 = generateInputAppWithShortcut({appBundleId: "bundleId1"});
            const appShortcuts2 = generateInputAppWithShortcut({appBundleId: "bundleId2"});
            expect(() => validator.validate([appShortcuts1, appShortcuts2])).toThrowError(
                new ValidationError(`Duplicated app name found: '${appShortcuts1.name}'`),
            );
        });

        it("Throws validation error if app has multiple keymaps with the same name", () => {
            const appShortcuts1 = generateInputAppWithShortcut({appBundleId: "bundleId1"});
            const keymapForApp1 = appShortcuts1.keymaps[0];
            appShortcuts1.keymaps.push(keymapForApp1);
            const appShortcuts2 = generateInputAppWithShortcut({appBundleId: "bundleId2", appName: "app2"});
            expect(() => validator.validate([appShortcuts1, appShortcuts2])).toThrowError(
                new ValidationError(`Duplicated keymap title '${keymapForApp1.title}' for application '${appShortcuts1.name}'`),
            );
        });

        it("Throws validation error if app has no keymaps", () => {
            const appShortcuts = generateInputAppWithShortcut();
            appShortcuts.keymaps = []
            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Application '${appShortcuts.name}' should contain at least one keymap`),
            );
        });

        it("Throws validation error if keymap title is empty", () => {
            const appShortcuts = generateInputAppWithShortcut();
            const emptyKeymap: InputKeymap = {
                title: "",
                sections: appShortcuts.keymaps[0].sections
            }
            appShortcuts.keymaps.push(emptyKeymap);
            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Keymap title should not be empty for application '${appShortcuts.name}'`),
            );
        });

        it("Throws validation error if keymap has not sections", () => {
            const appShortcuts = generateInputAppWithShortcut();
            appShortcuts.keymaps[0].sections = [];

            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Keymap '${appShortcuts.keymaps[0].title}' should contain at least one section for application '${appShortcuts.name}'`),
            );
        });

        it("Throws validation error if app has multiple keymap sections with the same name", () => {
            const appShortcuts = generateInputAppWithShortcut({appBundleId: "bundleId1"});
            const section = appShortcuts.keymaps[0].sections[0];
            appShortcuts.keymaps[0].sections.push(section);

            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Duplicated section title '${section.title}' per keymap for application '${appShortcuts.name}'`),
            );
        });

        it("Throws validation error if section title is empty", () => {
            const appShortcuts = generateInputAppWithShortcut({sectionTitle: ""});
            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Section title should not be empty for application '${appShortcuts.name}'`),
            );
        });

        it("Throws validation error if section has not shortcuts", () => {
            const appShortcuts = generateInputAppWithShortcut();
            appShortcuts.keymaps[0].sections[0].shortcuts = [];

            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Section '${appShortcuts.keymaps[0].sections[0].title}' should contain at least one shortcut for application '${appShortcuts.name}'`),
            );
        });

        it("Throws validation error if application has single keymap and it's title is not 'Default'", () => {
            const keymapTitle = "non-Default";
            const appShortcuts = generateInputAppWithShortcut({keymapTitle});

            expect(() => validator.validate([appShortcuts])).toThrowError(
                new ValidationError(`Single keymap should be named 'Default' instead of '${keymapTitle}' for application '${appShortcuts.name}'`),
            );
        });
    });
});

function generateInputAppWithShortcut(override?: {
    appBundleId?: string,
    appName?: string,
    keymapTitle?: string;
    sectionTitle?: string;
    title?: string,
    shortcut?: string,
    comment?: string
}): InputApp {
    return {
        bundleId: override?.appBundleId ?? "some-bundle-id",
        name: override?.appName ?? "some-name",
        keymaps: [
            {
                title: override?.keymapTitle ?? "Default",
                sections: [
                    {
                        title: override?.sectionTitle ?? "section-name",
                        shortcuts: [
                            {
                                title: override?.title ?? "shortcut",
                                key: override?.shortcut ?? "cmd+e",
                                comment: override?.comment ?? "some-comment"
                            },
                        ],
                    },
                ],
            },
        ],
    };
}
