import type { Application, AtomicShortcut, Keymap, Section, SectionShortcut } from "../model/internal/internal-models";
import { modifierMapping, type Modifiers } from "../model/internal/modifiers";
import type {
  CustomApp,
  CustomKeymap,
  CustomSection,
  CustomShortcut,
  ShortcutOverlay,
  UserCustomizations,
} from "./models";
import { getBaseShortcutId, getBaseShortcutSignature } from "./shortcut-identity";

export class ShortcutMerger {
  private readonly overlayMap = new Map<string, ShortcutOverlay>();
  private readonly legacyOverlayMap = new Map<string, ShortcutOverlay>();
  private readonly identityOverlayBaseKeys = new Set<string>();
  private readonly consumedLegacyOverlays = new Set<string>();
  private readonly customKeymaps: CustomKeymap[];

  constructor(customizations: UserCustomizations) {
    for (const overlay of customizations.shortcuts) {
      if (overlay.baseShortcutId) {
        this.identityOverlayBaseKeys.add(overlay.baseKey);
        this.overlayMap.set(this.buildOverlayIdentityKey(overlay.baseKey, overlay.baseShortcutId), overlay);
      } else {
        this.legacyOverlayMap.set(overlay.baseKey, overlay);
      }
    }
    this.customKeymaps = customizations.customKeymaps;
  }

  mergeShortcuts(baseApps: Application[], customizations: UserCustomizations): Application[] {
    return [
      ...baseApps.map((app) => this.mergeApp(app)),
      ...customizations.customApps.map((customApp) => this.convertCustomApp(customApp)),
    ];
  }

  private mergeApp(app: Application): Application {
    const customKeymaps = this.customKeymaps.filter((keymap) => keymap.baseAppSlug === app.slug);
    const keymaps = app.keymaps.map((keymap) => this.mergeKeymap(app.slug, keymap));

    return {
      ...app,
      keymaps: this.mergeCustomKeymaps(keymaps, customKeymaps),
    };
  }

  private mergeKeymap(appSlug: string, keymap: Keymap): Keymap {
    return {
      ...keymap,
      sections: keymap.sections.map((section) => this.mergeSection(appSlug, keymap.title, section)),
    };
  }

  private mergeSection(appSlug: string, keymapTitle: string, section: Section): Section {
    const occurrences = new Map<string, number>();
    const hotkeys = section.hotkeys
      .map((hotkey): SectionShortcut | null => {
        const signature = getBaseShortcutSignature(hotkey);
        const occurrence = occurrences.get(signature) ?? 0;
        occurrences.set(signature, occurrence + 1);
        const baseShortcutId = getBaseShortcutId(hotkey, occurrence);
        const baseKey = [appSlug, keymapTitle, section.title, hotkey.title].join(":");
        const overlay =
          this.overlayMap.get(this.buildOverlayIdentityKey(baseKey, baseShortcutId)) ?? this.getLegacyOverlay(baseKey);
        const baseHotkey: SectionShortcut = {
          ...hotkey,
          baseShortcutId,
          baseSectionTitle: section.title,
          baseShortcutTitle: hotkey.title,
        };

        if (!overlay) return baseHotkey;
        if (overlay.modification.isDeleted) return null;

        return {
          ...baseHotkey,
          title: overlay.modification.title ?? hotkey.title,
          sequence: overlay.modification.key ? this.parseShortcutKey(overlay.modification.key) : hotkey.sequence,
          comment: overlay.modification.comment ?? hotkey.comment,
          customizationStatus: "changed",
          customizationId: overlay.modification.id,
        };
      })
      .filter((shortcut): shortcut is SectionShortcut => shortcut !== null);

    return { ...section, hotkeys };
  }

  private mergeCustomKeymaps(keymaps: Keymap[], customKeymaps: CustomKeymap[]): Keymap[] {
    const merged = [...keymaps];
    for (const customKeymap of customKeymaps) {
      const index = merged.findIndex((keymap) => keymap.title === customKeymap.title);
      if (index >= 0) {
        merged[index] = this.mergeCustomSections(merged[index], customKeymap.sections);
      } else {
        const converted = this.convertCustomKeymap(customKeymap);
        if (converted.sections.length > 0) merged.push(converted);
      }
    }
    return merged;
  }

  private mergeCustomSections(keymap: Keymap, customSections: CustomSection[]): Keymap {
    const sections = [...keymap.sections];
    for (const customSection of this.sortSections(customSections)) {
      const converted = this.convertCustomSection(customSection);
      if (converted.hotkeys.length === 0) continue;
      const index = sections.findIndex((section) => section.title === converted.title);
      if (index >= 0) {
        sections[index] = {
          ...sections[index],
          hotkeys: [...sections[index].hotkeys, ...converted.hotkeys],
        };
      } else {
        sections.push(converted);
      }
    }
    return { ...keymap, sections };
  }

  private getLegacyOverlay(baseKey: string): ShortcutOverlay | undefined {
    if (this.identityOverlayBaseKeys.has(baseKey)) return undefined;
    if (this.consumedLegacyOverlays.has(baseKey)) return undefined;
    const overlay = this.legacyOverlayMap.get(baseKey);
    if (overlay) this.consumedLegacyOverlays.add(baseKey);
    return overlay;
  }

  private buildOverlayIdentityKey(baseKey: string, baseShortcutId: string): string {
    return `${baseKey}:${baseShortcutId}`;
  }

  private parseShortcutKey(key: string): AtomicShortcut[] {
    return key.split(" ").map((chord) => this.parseChord(chord));
  }

  private parseChord(chord: string): AtomicShortcut {
    const tokens = chord.split(/(?<!\+)\+/);
    const modifiers: Modifiers[] = [];
    for (const token of tokens.slice(0, -1)) {
      const modifier = modifierMapping.get(token);
      if (modifier) modifiers.push(modifier);
    }
    return {
      base: tokens[tokens.length - 1],
      modifiers,
    };
  }

  private convertCustomKeymap(customKeymap: CustomKeymap): Keymap {
    return {
      title: customKeymap.title,
      platforms: customKeymap.platforms,
      sections: this.sortSections(customKeymap.sections)
        .map((section) => this.convertCustomSection(section))
        .filter((section) => section.hotkeys.length > 0),
    };
  }

  private convertCustomSection(customSection: CustomSection): Section {
    return {
      title: customSection.title,
      hotkeys: this.sortShortcuts(customSection.shortcuts)
        .filter((shortcut) => !shortcut.isDeleted)
        .map((shortcut) => ({
          title: shortcut.title,
          sequence: shortcut.key ? this.parseShortcutKey(shortcut.key) : [],
          comment: shortcut.comment,
          customizationStatus: "created" as const,
          customizationId: shortcut.id,
        })),
    };
  }

  private sortSections(sections: CustomSection[]): CustomSection[] {
    return [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private sortShortcuts(shortcuts: CustomShortcut[]): CustomShortcut[] {
    return [...shortcuts].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private convertCustomApp(customApp: CustomApp): Application {
    return {
      name: customApp.name,
      slug: `custom-${customApp.slug}`,
      customAppId: customApp.id,
      bundleId: customApp.bundleId,
      hostname: customApp.hostname,
      icon: customApp.icon,
      source: customApp.source,
      keymaps: customApp.keymaps.map((keymap) => ({
        title: keymap.title,
        platforms: keymap.platforms,
        sections: this.sortSections(keymap.sections)
          .map((section) => this.convertCustomSection(section))
          .filter((section) => section.hotkeys.length > 0),
      })),
    };
  }
}
