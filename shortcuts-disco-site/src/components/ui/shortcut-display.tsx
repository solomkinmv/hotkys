"use client";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  AtomicShortcut,
  Platform,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import {
  getModifierNames,
  getModifierSymbols,
} from "@/lib/model/internal/modifiers";
import { cn } from "@/lib/utils";

const baseKeySymbolOverride: Record<string, string> = {
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  pageup: "PgUp",
  pagedown: "PgDn",
  home: "Home",
  end: "End",
  space: "Space",
  capslock: "⇪",
  backspace: "⌫",
  tab: "⇥",
  esc: "⎋",
  enter: "↩",
};

const baseKeySpokenName: Record<string, string> = {
  left: "Left Arrow",
  right: "Right Arrow",
  up: "Up Arrow",
  down: "Down Arrow",
  pageup: "Page Up",
  pagedown: "Page Down",
  capslock: "Caps Lock",
  backspace: "Backspace",
  tab: "Tab",
  esc: "Escape",
  enter: "Enter",
};

function formatBaseKey(base: string): string {
  return baseKeySymbolOverride[base] ?? base.toUpperCase();
}

function speakBaseKey(base: string): string {
  return baseKeySpokenName[base] ?? formatBaseKey(base);
}

const kbdClassName =
  "h-7 min-w-7 rounded-md border bg-background px-1.5 font-mono text-[13px] text-foreground shadow-[0_2px_0_hsl(var(--border))]";

interface AtomicShortcutDisplayProps {
  shortcut: AtomicShortcut;
  platforms?: Platform[];
}

function AtomicShortcutDisplay({
  shortcut,
  platforms,
}: AtomicShortcutDisplayProps) {
  const symbols = getModifierSymbols(platforms);
  const names = getModifierNames(platforms);
  const spokenLabel = [
    ...shortcut.modifiers.map((mod) => names.get(mod) ?? mod),
    speakBaseKey(shortcut.base),
  ].join(" ");

  return (
    <>
      <KbdGroup aria-hidden="true">
        {shortcut.modifiers.map((mod, index) => (
          <Kbd key={index} className={kbdClassName}>
            {symbols.get(mod) ?? mod}
          </Kbd>
        ))}
        <Kbd className={kbdClassName}>{formatBaseKey(shortcut.base)}</Kbd>
      </KbdGroup>
      <span className="sr-only">{spokenLabel}</span>
    </>
  );
}

interface ShortcutDisplayProps {
  shortcut: SectionShortcut;
  platforms?: Platform[];
  className?: string;
}

export function ShortcutDisplay({
  shortcut,
  platforms,
  className,
}: ShortcutDisplayProps) {
  if (shortcut.sequence.length === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-2",
        className,
      )}
    >
      {shortcut.sequence.map((atomic, index) => (
        <span key={index} className="inline-flex shrink-0 items-center gap-1">
          {index > 0 && (
            <span className="text-muted-foreground text-xs mx-1">then</span>
          )}
          <AtomicShortcutDisplay shortcut={atomic} platforms={platforms} />
        </span>
      ))}
    </span>
  );
}
