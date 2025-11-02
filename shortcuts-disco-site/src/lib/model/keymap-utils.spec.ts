import { describe, expect, it } from "@jest/globals";
import { serializeKeymap, keymapMatchesTitle } from "./keymap-utils";
import { Keymap } from "./internal/internal-models";

describe("serializeKeymap", () => {
    it("should serialize keymap title without platform", () => {
        const keymap: Keymap = {
            title: "Default",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("default");
    });

    it("should serialize keymap title with platform", () => {
        const keymap: Keymap = {
            title: "Default",
            platform: "macos",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("default-macos");
    });

    it("should handle Windows platform", () => {
        const keymap: Keymap = {
            title: "Windows Keys",
            platform: "windows",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("windows-keys-windows");
    });

    it("should handle Linux platform", () => {
        const keymap: Keymap = {
            title: "Linux Shortcuts",
            platform: "linux",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("linux-shortcuts-linux");
    });

    it("should replace special characters with dashes", () => {
        const keymap: Keymap = {
            title: "My Custom @ Keymap!",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("my-custom-keymap");
    });

    it("should handle multiple consecutive special characters", () => {
        const keymap: Keymap = {
            title: "Test!!!Multiple???Chars",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("test-multiple-chars");
    });

    it("should handle spaces correctly", () => {
        const keymap: Keymap = {
            title: "Multiple   Spaces   Here",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("multiple-spaces-here");
    });

    it("should preserve hyphens in title", () => {
        const keymap: Keymap = {
            title: "Pre-existing-hyphens",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("pre-existing-hyphens");
    });

    it("should handle title with numbers", () => {
        const keymap: Keymap = {
            title: "Version 2.0",
            platform: "macos",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("version-2-0-macos");
    });

    it("should convert to lowercase", () => {
        const keymap: Keymap = {
            title: "UPPERCASE TITLE",
            sections: [],
        };
        expect(serializeKeymap(keymap)).toBe("uppercase-title");
    });
});

describe("keymapMatchesTitle", () => {
    it("should match when serialized titles are equal", () => {
        const keymap: Keymap = {
            title: "Default",
            sections: [],
        };
        expect(keymapMatchesTitle(keymap, "default")).toBe(true);
    });

    it("should not match when serialized titles differ", () => {
        const keymap: Keymap = {
            title: "Default",
            sections: [],
        };
        expect(keymapMatchesTitle(keymap, "custom")).toBe(false);
    });

    it("should match with platform suffix", () => {
        const keymap: Keymap = {
            title: "Default",
            platform: "macos",
            sections: [],
        };
        expect(keymapMatchesTitle(keymap, "default-macos")).toBe(true);
    });

    it("should not match when platform differs", () => {
        const keymap: Keymap = {
            title: "Default",
            platform: "macos",
            sections: [],
        };
        expect(keymapMatchesTitle(keymap, "default-windows")).toBe(false);
    });

    it("should not match when keymap has platform but title does not", () => {
        const keymap: Keymap = {
            title: "Default",
            platform: "macos",
            sections: [],
        };
        expect(keymapMatchesTitle(keymap, "default")).toBe(false);
    });

    it("should handle special characters in matching", () => {
        const keymap: Keymap = {
            title: "Custom @ Keymap!",
            platform: "linux",
            sections: [],
        };
        expect(keymapMatchesTitle(keymap, "custom-keymap-linux")).toBe(true);
    });
});
