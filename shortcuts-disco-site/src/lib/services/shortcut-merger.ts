import type {
  AppShortcuts,
  Keymap,
  Section,
  SectionShortcut,
  AtomicShortcut,
} from "@/lib/model/internal/internal-models";
import { modifierMapping, Modifiers } from "@/lib/model/internal/modifiers";
import type {
  CustomApp,
  CustomKeymap,
  CustomSection,
  CustomShortcut,
  UserCustomizations,
  ShortcutOverlay,
} from "@/lib/model/user/user-models";

export class ShortcutMerger {
  private overlayMap: Map<string, ShortcutOverlay>;
  private customKeymaps: CustomKeymap[];

  constructor(customizations: UserCustomizations) {
    this.overlayMap = new Map();
    for (const overlay of customizations.shortcuts) {
      this.overlayMap.set(overlay.baseKey, overlay);
    }
    this.customKeymaps = customizations.customKeymaps ?? [];
  }

  mergeShortcuts(
    baseApps: AppShortcuts[],
    customizations: UserCustomizations
  ): AppShortcuts[] {
    const mergedApps = baseApps.map((app) => this.mergeApp(app));

    const customAppShortcuts = customizations.customApps.map((customApp) =>
      this.convertCustomAppToAppShortcuts(customApp)
    );

    return [...mergedApps, ...customAppShortcuts];
  }

  private mergeApp(app: AppShortcuts): AppShortcuts {
    const appCustomKeymaps = this.customKeymaps.filter(
      (keymap) => keymap.baseAppSlug === app.slug
    );
    const baseKeymaps = app.keymaps.map((keymap) =>
      this.mergeKeymap(app.slug, keymap)
    );

    return {
      ...app,
      keymaps: this.mergeCustomKeymaps(baseKeymaps, appCustomKeymaps),
    };
  }

  private mergeKeymap(appSlug: string, keymap: Keymap): Keymap {
    return {
      ...keymap,
      sections: keymap.sections.map((section) =>
        this.mergeSection(appSlug, keymap.title, section)
      ),
    };
  }

  private mergeSection(
    appSlug: string,
    keymapTitle: string,
    section: Section
  ): Section {
    const mergedHotkeys = section.hotkeys
      .map((hotkey) => {
        const key = this.buildOverlayKey(
          appSlug,
          keymapTitle,
          section.title,
          hotkey.title
        );
        const overlay = this.overlayMap.get(key);

        if (!overlay) return hotkey;

        if (overlay.modification.isDeleted) return null;

        return {
          ...hotkey,
          title: overlay.modification.title ?? hotkey.title,
          sequence: overlay.modification.key
            ? this.parseShortcutKey(overlay.modification.key)
            : hotkey.sequence,
          comment: overlay.modification.comment ?? hotkey.comment,
        };
      })
      .filter((h): h is SectionShortcut => h !== null);

    return {
      ...section,
      hotkeys: mergedHotkeys,
    };
  }

  private mergeCustomKeymaps(
    keymaps: Keymap[],
    customKeymaps: CustomKeymap[]
  ): Keymap[] {
    const mergedKeymaps = [...keymaps];

    for (const customKeymap of customKeymaps) {
      const keymapIndex = mergedKeymaps.findIndex(
        (keymap) => keymap.title === customKeymap.title
      );

      if (keymapIndex >= 0) {
        mergedKeymaps[keymapIndex] = this.mergeCustomSections(
          mergedKeymaps[keymapIndex],
          customKeymap.sections
        );
      } else {
        const convertedKeymap = this.convertCustomKeymapToKeymap(customKeymap);
        if (convertedKeymap.sections.length > 0) {
          mergedKeymaps.push(convertedKeymap);
        }
      }
    }

    return mergedKeymaps;
  }

  private mergeCustomSections(
    keymap: Keymap,
    customSections: CustomSection[]
  ): Keymap {
    const sections = [...keymap.sections];

    for (const customSection of this.sortSections(customSections)) {
      const convertedSection = this.convertCustomSectionToSection(customSection);
      if (convertedSection.hotkeys.length === 0) {
        continue;
      }

      const sectionIndex = sections.findIndex(
        (section) => section.title === convertedSection.title
      );
      if (sectionIndex >= 0) {
        sections[sectionIndex] = {
          ...sections[sectionIndex],
          hotkeys: [
            ...sections[sectionIndex].hotkeys,
            ...convertedSection.hotkeys,
          ],
        };
      } else {
        sections.push(convertedSection);
      }
    }

    return {
      ...keymap,
      sections,
    };
  }

  private buildOverlayKey(
    appSlug: string,
    keymapTitle: string,
    sectionTitle: string,
    shortcutTitle: string
  ): string {
    return `${appSlug}:${keymapTitle}:${sectionTitle}:${shortcutTitle}`;
  }

  private parseShortcutKey(key: string): AtomicShortcut[] {
    const chords = key.split(" ");
    return chords.map((chord) => this.parseChord(chord));
  }

  private parseChord(chord: string): AtomicShortcut {
    const chordTokens = chord.split("+");
    const totalNumberOfTokens = chordTokens.length;
    const modifiers: Modifiers[] = [];
    for (let i = 0; i < totalNumberOfTokens - 1; i++) {
      const token = chordTokens[i];
      const modifier = modifierMapping.get(token);
      if (modifier) {
        modifiers.push(modifier);
      }
    }
    const baseToken = chordTokens[totalNumberOfTokens - 1];
    return {
      base: baseToken,
      modifiers: modifiers,
    };
  }

  private convertCustomKeymapToKeymap(customKeymap: CustomKeymap): Keymap {
    return {
      title: customKeymap.title,
      platforms: customKeymap.platforms,
      sections: this.sortSections(customKeymap.sections)
        .map((section) => this.convertCustomSectionToSection(section))
        .filter((section) => section.hotkeys.length > 0),
    };
  }

  private convertCustomSectionToSection(customSection: CustomSection): Section {
    return {
      title: customSection.title,
      hotkeys: this.sortShortcuts(customSection.shortcuts)
        .filter((shortcut) => !shortcut.isDeleted)
        .map((shortcut) => ({
          title: shortcut.title,
          sequence: shortcut.key ? this.parseShortcutKey(shortcut.key) : [],
          comment: shortcut.comment,
        })),
    };
  }

  private sortSections(sections: CustomSection[]): CustomSection[] {
    return [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private sortShortcuts(shortcuts: CustomShortcut[]): CustomShortcut[] {
    return [...shortcuts].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private convertCustomAppToAppShortcuts(customApp: CustomApp): AppShortcuts {
    return {
      name: customApp.name,
      slug: `custom-${customApp.slug}`,
      bundleId: customApp.bundleId,
      icon: customApp.icon,
      source: customApp.source,
      keymaps: customApp.keymaps.map((km) => ({
        title: km.title,
        platforms: km.platforms,
        sections: this.sortSections(km.sections)
          .map((section) => this.convertCustomSectionToSection(section))
          .filter((section) => section.hotkeys.length > 0),
      })),
    };
  }
}
