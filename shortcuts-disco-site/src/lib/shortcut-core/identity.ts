// Generated from shared/shortcuts-core; run scripts/sync-shortcuts-core.mjs --write.
import type { IdentifiableShortcut } from "./types";
function parts(shortcut: IdentifiableShortcut): unknown[] {
  return [shortcut.sequence.map((atomic) => [atomic.base, atomic.modifiers]), shortcut.title, shortcut.comment ?? ""];
}
// Persisted wire format: do not change modifier spelling or array ordering.
export function getBaseShortcutId(shortcut: IdentifiableShortcut, occurrence: number): string {
  return JSON.stringify([...parts(shortcut), occurrence]);
}

export function getSectionIds(shortcuts: IdentifiableShortcut[]): string[] {
  const seen = new Map<string, number>();
  return shortcuts.map((row) => {
    const signature = JSON.stringify(parts(row));
    const occurrence = seen.get(signature) ?? 0;
    seen.set(signature, occurrence + 1);
    return getBaseShortcutId(row, occurrence);
  });
}
