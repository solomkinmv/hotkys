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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function AppIcon({ icon, appName, size = "sm", className }: AppIconProps) {
  const iconUrl = getIconUrl(icon);
  const [imgError, setImgError] = useState(false);

  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-8 w-8";
  const textSize = size === "sm" ? "text-[8px]" : "text-sm";

  const showFallback = !iconUrl || imgError;

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-sm bg-muted flex items-center justify-center overflow-hidden shrink-0",
        className
      )}
    >
      {!showFallback ? (
        <img
          src={iconUrl}
          alt={`${appName} icon`}
          className="h-full w-full object-cover rounded-sm"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={cn("text-muted-foreground font-medium", textSize)}>
          {getInitials(appName)}
        </span>
      )}
    </div>
  );
}
