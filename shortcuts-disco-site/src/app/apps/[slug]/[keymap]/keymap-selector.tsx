"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Keymap } from "@/lib/model/internal/internal-models";
import Link from "next/link";
import { serializeKeymap } from "@/lib/model/keymap-utils";
import { Badge } from "@/components/ui/badge";
import { getPlatformDisplay } from "@/lib/utils";

interface KeymapSelectorProps {
  keymaps: Keymap[];
  activeKeymap: string;
  urlPrefix: string;
}

export function KeymapSelector({
  keymaps,
  activeKeymap,
  urlPrefix,
}: KeymapSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Find the active keymap object
  const activeKeymapObj = keymaps.find((k) => k.title === activeKeymap);
  const activePlatforms = activeKeymapObj?.platforms ?? [];
  const triggerContent = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{activeKeymap}</span>
        {activePlatforms.map((platform) => (
          <Badge
            key={platform}
            variant="outline"
            className="shrink-0 rounded-md font-normal text-xs"
            aria-label={`Platform: ${getPlatformDisplay(platform)}`}
          >
            {getPlatformDisplay(platform)}
          </Badge>
        ))}
      </div>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </>
  );

  if (!mounted) {
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={false}
        aria-label="Choose keymap"
        className="h-12 w-full justify-between gap-2 rounded-xl bg-card px-3 shadow-xs"
        disabled
      >
        {triggerContent}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Choose keymap"
          className="h-12 w-full justify-between gap-2 rounded-xl bg-card px-3 shadow-xs"
        >
          {triggerContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-60 rounded-xl p-1.5"
      >
        {keymaps.map((keymap) => (
          <Link
            href={`${urlPrefix}/${serializeKeymap(keymap)}`}
            passHref
            key={keymap.title}
            aria-current={keymap.title === activeKeymap ? "page" : undefined}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm hover:bg-accent aria-[current=page]:bg-brand/8 aria-[current=page]:text-brand"
          >
            <span className="min-w-0 font-medium">{keymap.title}</span>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
              {keymap.platforms?.map((platform) => (
                <Badge
                  key={platform}
                  variant="outline"
                  className="text-xs"
                  aria-label={`Platform: ${getPlatformDisplay(platform)}`}
                >
                  {getPlatformDisplay(platform)}
                </Badge>
              ))}
            </div>
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}
