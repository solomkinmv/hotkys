"use client";

import { ShortcutDisplay } from "@/components/ui/shortcut-display";
import type {
  Platform,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import {
  getModifierSymbols,
  modifierMapping,
} from "@/lib/model/internal/modifiers";
import { cn } from "@/lib/utils";

export function ShortcutMethod({
  shortcut,
  platforms,
  compact = false,
  className,
}: {
  shortcut: SectionShortcut;
  platforms?: Platform[];
  compact?: boolean;
  className?: string;
}) {
  const hasKeys = shortcut.sequence.length > 0;
  if (!hasKeys && !shortcut.comment) return null;

  return (
    <div
      role="group"
      aria-label={`How to do it: ${shortcut.title}`}
      className={cn(
        "flex min-w-0 flex-col items-start gap-1.5 text-left",
        className,
      )}
    >
      {hasKeys && (
        <ShortcutDisplay
          shortcut={shortcut}
          platforms={platforms}
          className={cn(
            "max-w-full justify-start",
            compact &&
              "[&_[data-slot=kbd]]:h-6 [&_[data-slot=kbd]]:min-w-6 [&_[data-slot=kbd]]:text-xs",
          )}
        />
      )}
      {shortcut.comment && (
        <span
          className={cn(
            "max-w-full break-words text-sm leading-relaxed",
            hasKeys ? "text-foreground/80" : "text-foreground",
          )}
        >
          {generateCommentText(shortcut.comment, platforms)}
        </span>
      )}
    </div>
  );
}

function generateCommentText(
  optionalComment: string | undefined,
  platforms: Platform[] | undefined,
): string | undefined {
  if (optionalComment === undefined) {
    return undefined;
  }
  let comment = optionalComment;
  const modifierSymbols = getModifierSymbols(platforms);
  modifierMapping.forEach((modifier, text) => {
    comment = comment.replace(
      "{" + text + "}",
      modifierSymbols.get(modifier) ?? "",
    );
  });
  baseKeySymbolOverride.forEach((symbol, key) => {
    comment = comment.replace("{" + key + "}", symbol);
  });
  return comment;
}

const baseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
]);
