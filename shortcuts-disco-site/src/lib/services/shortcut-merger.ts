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
  UserCustomizations,
  ShortcutOverlay,
} from "@/lib/model/user/user-models";

export class ShortcutMerger {
  private overlayMap: Map<string, ShortcutOverlay>;

  constructor(customizations: UserCustomizations) {
    this.overlayMap = new Map();
    for (const overlay of customizations.shortcuts) {
      this.overlayMap.set(overlay.baseKey, overlay);
    }
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
    return {
      ...app,
      keymaps: app.keymaps.map((keymap) =>
        this.mergeKeymap(app.slug, keymap)
      ),
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
        sections: km.sections.map((s) => ({
          title: s.title,
          hotkeys: s.shortcuts.map((sh) => ({
            title: sh.title,
            sequence: sh.key ? this.parseShortcutKey(sh.key) : [],
            comment: sh.comment,
          })),
        })),
      })),
    };
  }
}
