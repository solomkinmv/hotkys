"use client";

import { useState } from "react";
import { getIconUrl } from "@/lib/utils/icon-helpers";
import { cn } from "@/lib/utils";

interface AppIconProps {
  icon: string | undefined;
  appName: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Renders an app icon with fallback to first letter if icon is missing or fails to load.
 */
export function AppIcon({ icon, appName, size = "sm", className }: AppIconProps) {
  const [hasError, setHasError] = useState(false);
  const iconUrl = getIconUrl(icon);

  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-8 h-8";
  const textSize = size === "sm" ? "text-[10px]" : "text-sm";

  if (!iconUrl || hasError) {
    return (
      <span
        className={cn(
          sizeClasses,
          "rounded bg-muted flex items-center justify-center font-medium text-muted-foreground shrink-0",
          textSize,
          className
        )}
      >
        {appName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${appName} icon`}
      className={cn(sizeClasses, "rounded shrink-0", className)}
      onError={() => setHasError(true)}
    />
  );
}
