import type { SectionShortcut } from "../model/internal/internal-models";

export function getBaseShortcutId(shortcut: SectionShortcut, occurrence: number): string {
  return JSON.stringify([
    shortcut.sequence.map((atomic) => [atomic.base, atomic.modifiers]),
    shortcut.title,
    shortcut.comment ?? "",
    occurrence,
  ]);
}

export function getBaseShortcutSignature(shortcut: SectionShortcut): string {
  return JSON.stringify([
    shortcut.sequence.map((atomic) => [atomic.base, atomic.modifiers]),
    shortcut.title,
    shortcut.comment ?? "",
  ]);
}
