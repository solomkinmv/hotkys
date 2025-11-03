"use client";

import { Check, Monitor } from "lucide-react";
import * as React from "react";
import { Platform } from "@/lib/model/internal/internal-models";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPlatformIcon } from "@/lib/utils/platform-helpers";
import { getPlatformDisplay } from "@/lib/utils";

const ALL_PLATFORMS: Platform[] = ["windows", "linux", "macos"];

interface PlatformFilterProps {
  platformFilter: Platform | null;
  setPlatformFilter: (filter: Platform | null) => void;
}

export function PlatformFilter({
  platformFilter,
  setPlatformFilter,
}: PlatformFilterProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const selectPlatform = (platform: Platform | null) => {
    setPlatformFilter(platform);
  };

  // Determine which icon to show
  const currentIcon = platformFilter ? (
    <span className="text-base">{getPlatformIcon(platformFilter)}</span>
  ) : (
    <Monitor className="h-[1.2rem] w-[1.2rem]" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {currentIcon}
          <span className="sr-only">Filter by platform</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => selectPlatform(null)}
          className="flex justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>All</span>
          </span>
          {platformFilter === null && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <div className="my-1 h-px bg-border" />
        {ALL_PLATFORMS.map((platform) => {
          const isSelected = platformFilter === platform;
          return (
            <DropdownMenuItem
              key={platform}
              onClick={() => selectPlatform(platform)}
              className="flex justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>{getPlatformIcon(platform)}</span>
                <span>{getPlatformDisplay(platform)}</span>
              </span>
              {isSelected && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
