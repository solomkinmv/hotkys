/* eslint-disable @next/next/no-img-element -- Static export uses small catalog or user-provided icons without an image optimization server. */
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

const monogramStyles = [
  "rounded-[28%] bg-[#e8edf5] text-[#263b60] ring-1 ring-inset ring-[#263b60]/10",
  "rounded-full bg-[#2d5d50] text-[#f3f7ed] shadow-xs",
  "rounded-[25%_25%_25%_4%] bg-[#f7e7de] text-[#923c24] ring-1 ring-inset ring-[#923c24]/10",
  "rounded-[28%] bg-[#d4ab58] text-[#382d19] shadow-xs",
  "rounded-[4%_28%_4%_28%] bg-[#344353] text-[#f4f0e8] shadow-xs",
  "rounded-full bg-[#f5ecf0] text-[#704356] ring-1 ring-inset ring-[#b794a2]",
];

// These assets have cutout letters; an inset backing preserves their transparent edges.
const iconLetterColors: Record<string, string> = {
  "/icons/adobe-illustrator.png": "#ff9a00",
  "/icons/adobe-photoshop.png": "#31a8ff",
  "/icons/adobe-xd.png": "#ff61f6",
};

// Dark marks need a stable light surface in either theme.
const iconsWithLightSurface = new Set([
  "/icons/atom.png",
  "/icons/githubdesktop.png",
  "/icons/macos.png",
  "/icons/miro.png",
  "/icons/zendesk-support.png",
]);

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => (Array.from(word)[0] ?? "").toUpperCase())
    .join("") || "?";
}

export function AppIcon({ icon, appName, size = "sm", className }: AppIconProps) {
  const iconUrl = getIconUrl(icon);
  const letterColor = iconLetterColors[iconUrl ?? ""];
  const [failedIcon, setFailedIcon] = useState<string>();

  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-8 w-8";
  const textSize = size === "sm" ? "text-[8px]" : "text-sm";
  const showFallback = !iconUrl || failedIcon === iconUrl;
  let hash = 0;
  for (const character of appName.trim().toLowerCase()) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return (
    <div
      className={cn(
        sizeClasses,
        "rounded-sm flex items-center justify-center shrink-0",
        className
      )}
    >
      {!showFallback ? (
        <img
          src={iconUrl}
          alt={`${appName} icon`}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover rounded-[inherit]",
            iconsWithLightSurface.has(iconUrl) && "bg-[#f4f0e8] p-[8%]"
          )}
          style={letterColor ? {
            backgroundImage: `linear-gradient(${letterColor}, ${letterColor})`,
            backgroundPosition: "center",
            backgroundSize: "70% 70%",
            backgroundRepeat: "no-repeat",
          } : undefined}
          onError={() => setFailedIcon(iconUrl)}
        />
      ) : (
        <span
          role="img"
          aria-label={`${appName} icon`}
          className={cn(
            "flex size-full items-center justify-center font-mono font-semibold leading-none select-none",
            textSize,
            monogramStyles[hash % monogramStyles.length]
          )}
        >
          {getInitials(appName)}
        </span>
      )}
    </div>
  );
}
