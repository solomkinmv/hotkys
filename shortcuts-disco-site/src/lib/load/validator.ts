import {InputApp, InputKeymap, InputSection, InputShortcut} from "@/lib/model/input/input-models";
import {modifierMapping, modifierTokensOrderMapping} from "@/lib/model/internal/modifiers";

const VALID_PLATFORMS = ['windows', 'linux', 'macos'] as const;

export default class Validator {
    constructor(private readonly keyCodes: Map<string, string>) {
    }

    public validate(inputApps: InputApp[]): void {
        this.validateUniqueApplications(inputApps);
        inputApps.forEach((inputApp) => {
            this.validateKeymaps(inputApp.keymaps, inputApp.name);
            inputApp.keymaps.forEach((inputKeymap) => {
                this.validateSections(inputKeymap.sections, inputApp.name);
                inputKeymap.sections.forEach((inputSection) => {
                    inputSection.shortcuts.forEach(this.validateShortcut.bind(this));
                });
            });
        });
    }

    private validateUniqueApplications(inputApps: InputApp[]) {
        const bundleIds = new Set<string>();
        const appNames = new Set<string>();
        const slugs = new Set<string>();
        inputApps.forEach((app) => {
            if (appNames.has(app.name)) {
                throw new ValidationError(`Duplicated app name found: '${app.name}'`);
            }
            appNames.add(app.name);

            if (slugs.has(app.slug)) {
                throw new ValidationError(`Duplicated slug found: '${app.slug}'`);
            }
            slugs.add(app.slug);

            if (!app.bundleId) return;
            if (bundleIds.has(app.bundleId)) {
                throw new ValidationError(`Duplicated app bundleId found: '${app.bundleId}'`)
            }
            bundleIds.add(app.bundleId);
        })
    }

    private validateKeymaps(keymaps: InputKeymap[], appName: string) {
        const keymapNames = new Set<string>();
        if (keymaps.length === 0) {
            throw new ValidationError(`Application '${appName}' should contain at least one keymap`);
        }
        if (keymaps.length === 1 && keymaps[0].title !== "Default") {
            throw new ValidationError(`Single keymap should be named 'Default' instead of '${keymaps[0].title}' for application '${appName}'`)
        }
        keymaps.forEach((keymap) => {
            if (keymap.sections.length === 0) {
                throw new ValidationError(`Keymap '${keymap.title}' should contain at least one section for application '${appName}'`);
            }
            if (keymap.title.length === 0) {
                throw new ValidationError(`Keymap title should not be empty for application '${appName}'`);
            }
            if (keymapNames.has(keymap.title)) {
                throw new ValidationError(`Duplicated keymap title '${keymap.title}' for application '${appName}'`);
            }
            keymapNames.add(keymap.title);

            if (keymap.platform !== undefined) {
                if (!VALID_PLATFORMS.includes(keymap.platform as any)) {
                    throw new ValidationError(
                        `Invalid platform "${keymap.platform}" in keymap "${keymap.title}". Must be one of: ${VALID_PLATFORMS.join(', ')}`
                    );
                }
            }
        })
    }

    private validateSections(sections: InputSection[], appName: string) {
        const sectionNames = new Set<string>();
        sections.forEach((section) => {
            if (section.shortcuts.length === 0) {
                throw new ValidationError(`Section '${section.title}' should contain at least one shortcut for application '${appName}'`);
            }
            if (section.title.length === 0) {
                throw new ValidationError(`Section title should not be empty for application '${appName}'`);
            }
            if (sectionNames.has(section.title)) {
                throw new ValidationError(`Duplicated section title '${section.title}' per keymap for application '${appName}'`);
            }
            sectionNames.add(section.title);
        })
    }

    private validateShortcut(inputShortcut: InputShortcut): void {
        inputShortcut.key?.split(" ").forEach((chord) => this.validateChord(inputShortcut.key!, chord));
        if (inputShortcut.title.length > 50) {
            throw new ValidationError(`Title longer than 50 symbols: '${inputShortcut.title}'`);
        }
        if (inputShortcut.comment && inputShortcut.comment.length > 50) {
            throw new ValidationError(`Comment longer than 50 symbols: '${inputShortcut.comment}'`);
        }
        if (inputShortcut.key === undefined && inputShortcut.comment === undefined) {
            throw new ValidationError(`Shortcut '${inputShortcut.title}' should contains at least key or comment`); // todo: add test
        }
    }

    private validateChord(fullShortcutKey: string, chord: string): void {
        const chordTokens = chord.split(/(?<!\+)\+/);
        const totalNumberOfTokens = chordTokens.length;
        this.validateModifiersExist(totalNumberOfTokens, chordTokens, fullShortcutKey);
        this.validateOrderOfModifiers(totalNumberOfTokens, chordTokens, fullShortcutKey);
        this.validateBaseShortcutToken(chordTokens[totalNumberOfTokens - 1], fullShortcutKey)
        this.validateUniqueTokens(totalNumberOfTokens, chordTokens, fullShortcutKey);
    }

    private validateUniqueTokens(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
        if (totalNumberOfTokens !== new Set(chordTokens).size) {
            throw new ValidationError(`Shortcut tokens are repeated: '${fullShortcutKey}'`);
        }
    }

    private validateModifiersExist(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
        for (let i = 0; i < totalNumberOfTokens - 1; i++) {
            const token = chordTokens[i];
            if (token === "") {
                throw new ValidationError(`Invalid shortcut: '${fullShortcutKey}'`);
            }
            const modifier = modifierMapping.get(token);
            if (modifier === undefined) {
                throw new ValidationError(`Modifier doesn't exist: '${fullShortcutKey}'`);
            }
        }
    }

    private validateOrderOfModifiers(totalNumberOfTokens: number, chordTokens: string[], fullShortcutKey: string) {
        for (let i = 0; i < totalNumberOfTokens - 2; i++) {
            const idx1 = modifierTokensOrderMapping.get(chordTokens[i]) ?? -1;
            const idx2 = modifierTokensOrderMapping.get(chordTokens[i + 1]) ?? -1;
            if (idx1 < 0 || idx2 < 0 || idx1 >= idx2) {
                throw new ValidationError(
                    `Modifiers have incorrect order. Received: '${fullShortcutKey}'. Correct order: ctrl, shift, opt, cmd`,
                );
            }
        }
    }

    private validateBaseShortcutToken(baseToken: string, fullShortcutKey: string) {
        if (this.keyCodes.has(baseToken)) return;
        if (modifierMapping.has(baseToken)) {
            throw new ValidationError(`Shortcut expression should end with base key: '${fullShortcutKey}'`);
        }
        throw new ValidationError(`Unknown base key for shortcut: '${fullShortcutKey}'`);
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, new.target.prototype); // Ensure proper inheritance
    }
}
