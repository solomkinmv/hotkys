import Validator, {ValidationError} from "./validator";
import {InputApp} from "../model/input/input-models";
import {parseKeyCodes} from "../../../__tests__/helpers.spec";

// todo: validate all lowercase
// todo: validate no spaces
// todo: base in supported list
// todo: the same keymap names per app
// todo: the same section names
// todo: the same shortcut names (in section?)
// todo: the same app bundle ids or names
// todo: single keymap should be named "Default"

describe("Throws validation error", () => {
    const validator = new Validator(parseKeyCodes());

    it("Throws validation error if incorrect modifier", () => {
        expect(() => validator.validate([generateInputAppWithShortcut({shortcut: "abc+e"})])).toThrowError(
            new ValidationError("Modifier 'abc' doesn't exist"),
        );
    });

    it.each([
        "cmd+💩",
        "cmd+",
        "cmd+e shift+abc",
        "cmd+e ctrl+"
    ])("Throw validation error if base key unknown %p", (shortcut: string) => {
        expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
            new ValidationError(`Unknown base key for shortcut: '${shortcut}'`),
        );
    });

    it.each([
        "ctrl",
        "shift",
        "cmd",
        "ctrl",
        "ctrl+shift+opt+cmd",
        "ctrl",
    ])("Throws validation error if base key is missing %p", (shortcut: string) => {
        expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
            new ValidationError(`Shortcut expression should end with base key: '${shortcut}'`),
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
        "ctrl+shift+opt+cmd+e cmd+opt+e",
    ])("Throws validation error if modifiers are not in order %p", (shortcut: string) => {
        expect(() => validator.validate([generateInputAppWithShortcut({shortcut})])).toThrowError(
            new ValidationError(`Modifiers have incorrect order. Received: '${shortcut}'. Correct order: ctrl, shift, opt, cmd`),
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

function generateInputAppWithShortcut(override?: { title?: string, shortcut?: string, comment?: string }): InputApp {
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
