import { splitChord } from "@/lib/shortcut-core/parser";
import {
  modifierMapping,
  modifierTokensOrderMapping,
} from "@/lib/model/internal/modifiers";

export const SHORTCUT_MODIFIER_TOKENS = [
  "ctrl",
  "shift",
  "opt",
  "cmd",
] as const;

export type ShortcutModifierToken = (typeof SHORTCUT_MODIFIER_TOKENS)[number];

const FORMAT_REPLACEMENTS: [RegExp, string][] = [
  [/\boption\b/g, "opt"],
  [/\balt\b/g, "alt"],
  [/\bcommand\b/g, "cmd"],
  [/\bescape\b/g, "esc"],
  [/\bpgup\b/g, "pageup"],
  [/\bpgdown\b/g, "pagedown"],
];

export function normalizeShortcutKey(key: string): string {
  return normalizeShortcutSpacing(key)
    .split(" ")
    .filter(Boolean)
    .map(normalizeChord)
    .join(" ");
}

export function getShortcutModifierTokens(
  key: string,
): ShortcutModifierToken[] {
  const chord = getActiveChord(key);
  if (!chord) return [];

  return splitChord(chord).filter(isShortcutModifierToken);
}

export function setShortcutModifierTokens(
  key: string,
  modifiers: ShortcutModifierToken[],
): string {
  const normalized = normalizeShortcutSpacing(key);
  const parts = normalized ? normalized.split(" ") : [""];
  const activeIndex = /\s$/.test(key) ? parts.length : parts.length - 1;
  if (activeIndex === parts.length) {
    parts.push("");
  }

  const activeTokens = splitChord(parts[activeIndex] ?? "").filter(Boolean);
  const baseTokens = activeTokens.filter((token) => !modifierMapping.has(token));
  const sortedModifiers = sortModifierTokens(Array.from(new Set(modifiers)));

  if (baseTokens.length === 1) {
    parts[activeIndex] = [...sortedModifiers, baseTokens[0]].join("+");
  } else {
    parts[activeIndex] =
      sortedModifiers.length > 0 ? `${sortedModifiers.join("+")}+` : "";
  }

  return parts.join(" ").trimStart();
}

function normalizeShortcutSpacing(key: string): string {
  let normalized = key.toLowerCase().trim().replace(/\b(ctrl|shift|opt|alt|cmd|win|option|command)\s*\+\s*/g, "$1+");
  for (const [pattern, replacement] of FORMAT_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/\s+/g, " ");
}

function normalizeChord(chord: string): string {
  const tokens = splitChord(chord);
  const modifiers = tokens.filter((token) => modifierMapping.has(token));
  const baseTokens = tokens.filter((token) => !modifierMapping.has(token));

  if (baseTokens.length !== 1) {
    return tokens.join("+");
  }

  return [...sortModifierTokens(modifiers), baseTokens[0]].join("+");
}

function getActiveChord(key: string): string {
  if (/\s$/.test(key)) return "";
  const parts = normalizeShortcutSpacing(key).split(" ");
  return parts[parts.length - 1] ?? "";
}

function sortModifierTokens<T extends string>(modifiers: T[]): T[] {
  return modifiers.sort(
    (a, b) =>
      (modifierTokensOrderMapping.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (modifierTokensOrderMapping.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

function isShortcutModifierToken(
  token: string,
): token is ShortcutModifierToken {
  return SHORTCUT_MODIFIER_TOKENS.includes(token as ShortcutModifierToken);
}
