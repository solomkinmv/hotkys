"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import {
  getShortcutModifierTokens,
  setShortcutModifierTokens,
  SHORTCUT_MODIFIER_TOKENS,
  type ShortcutModifierToken,
} from "@/lib/shortcut-key-format";
import { USER_CONTENT_LIMITS } from "@/lib/validation/user-content";

const shortcutModifierLabels: Record<ShortcutModifierToken, string> = {
  cmd: "Cmd",
  opt: "Opt",
  ctrl: "Ctrl",
  shift: "Shift",
};
const shortcutModifierDisplayOrder: ShortcutModifierToken[] = [
  "cmd",
  "opt",
  "ctrl",
  "shift",
];

interface ShortcutKeyInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputAriaLabel?: string;
}

export function ShortcutKeyInput({
  id,
  value,
  onChange,
  placeholder = "cmd+k",
  inputAriaLabel,
}: ShortcutKeyInputProps) {
  const activeModifiers = getShortcutModifierTokens(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          aria-label={inputAriaLabel}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={USER_CONTENT_LIMITS.shortcutKey}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Shortcut key format"
            >
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="flex flex-col gap-2">
              <TypographySmall>Shortcut key format</TypographySmall>
              <TypographyMuted className="text-sm">
                Use lowercase tokens joined with plus signs. Modifiers are
                saved in ctrl, shift, opt, cmd order before one base key.
                Separate shortcut sequences with spaces.
              </TypographyMuted>
              <TypographyMuted className="text-sm">
                Examples: cmd+k, shift+cmd+z, cmd+k cmd+s.
              </TypographyMuted>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={activeModifiers}
        onValueChange={(modifiers) =>
          onChange(
            setShortcutModifierTokens(
              value,
              modifiers.filter(isShortcutModifierToken),
            ),
          )
        }
        aria-label="Shortcut modifiers"
        className="justify-start"
      >
        {shortcutModifierDisplayOrder.map((modifier) => (
          <ToggleGroupItem
            key={modifier}
            value={modifier}
            aria-label={`Add ${modifier} modifier`}
          >
            {shortcutModifierLabels[modifier]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function isShortcutModifierToken(token: string): token is ShortcutModifierToken {
  return SHORTCUT_MODIFIER_TOKENS.includes(token as ShortcutModifierToken);
}
