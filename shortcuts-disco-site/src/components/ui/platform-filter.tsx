"use client";

import { Check, Filter } from "lucide-react";
import * as React from "react";
import { Platform } from "@/lib/model/internal/internal-models";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getPlatformIcon } from "@/lib/utils/platform-helpers";
import { getPlatformDisplay } from "@/lib/utils";

const ALL_PLATFORMS: Platform[] = ["windows", "linux", "macos"];

interface PlatformFilterProps {
  platformFilters: Set<Platform>;
  setPlatformFilters: (filters: Set<Platform>) => void;
}

export function PlatformFilter({
  platformFilters,
  setPlatformFilters,
}: PlatformFilterProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const togglePlatform = (platform: Platform) => {
    const newFilters = new Set(platformFilters);
    if (newFilters.has(platform)) {
      newFilters.delete(platform);
    } else {
      newFilters.add(platform);
    }
    setPlatformFilters(newFilters);
  };

  const selectAll = () => {
    setPlatformFilters(new Set(ALL_PLATFORMS));
  };

  const selectNone = () => {
    setPlatformFilters(new Set());
  };

  const isFiltering = platformFilters.size < ALL_PLATFORMS.length;
  const activeCount = platformFilters.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-[1.2rem] w-[1.2rem]" />
          {isFiltering && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {activeCount}
            </Badge>
          )}
          <span className="sr-only">Filter by platform</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={selectAll}
          className="flex justify-between cursor-pointer"
        >
          Select All
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={selectNone}
          className="flex justify-between cursor-pointer"
        >
          Select None
        </DropdownMenuItem>
        <div className="my-1 h-px bg-border" />
        {ALL_PLATFORMS.map((platform) => {
          const isSelected = platformFilters.has(platform);
          return (
            <DropdownMenuItem
              key={platform}
              onClick={() => togglePlatform(platform)}
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
