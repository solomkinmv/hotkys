"use client";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  AtomicShortcut,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import { Modifiers, modifierSymbols } from "@/lib/model/internal/modifiers";
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

function formatBaseKey(base: string): string {
  return baseKeySymbolOverride[base] ?? base.toUpperCase();
}

function formatModifier(modifier: Modifiers): string {
  return modifierSymbols.get(modifier) ?? modifier;
}

interface AtomicShortcutDisplayProps {
  shortcut: AtomicShortcut;
}

function AtomicShortcutDisplay({ shortcut }: AtomicShortcutDisplayProps) {
  const modifierKeys = shortcut.modifiers.map((mod) => formatModifier(mod));
  const baseKey = formatBaseKey(shortcut.base);

  return (
    <KbdGroup>
      {modifierKeys.map((mod, index) => (
        <Kbd
          key={index}
          className="h-7 min-w-7 rounded-md border bg-background px-1.5 font-mono text-[13px] text-foreground shadow-[0_2px_0_hsl(var(--border))]"
        >
          {mod}
        </Kbd>
      ))}
      <Kbd className="h-7 min-w-7 rounded-md border bg-background px-1.5 font-mono text-[13px] text-foreground shadow-[0_2px_0_hsl(var(--border))]">
        {baseKey}
      </Kbd>
    </KbdGroup>
  );
}

interface ShortcutDisplayProps {
  shortcut: SectionShortcut;
  className?: string;
}

export function ShortcutDisplay({ shortcut, className }: ShortcutDisplayProps) {
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
          <AtomicShortcutDisplay shortcut={atomic} />
        </span>
      ))}
    </span>
  );
}
