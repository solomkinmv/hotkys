/* eslint-disable @next/next/no-img-element -- Static export uses small catalog or user-provided icons without an image optimization server. */
"use client";

import { useState } from "react";
import { getIconUrl } from "@/lib/utils/icon-helpers";
import {
  getIconVariantUrl,
  type IconVariantWidth,
} from "@/lib/utils/image-variants";
import { cn } from "@/lib/utils";

interface AppIconProps {
  icon: string | undefined;
  appName: string;
  size?: AppIconSize;
  /** Loads the icon eagerly with high priority, for above-the-fold headers. */
  priority?: boolean;
  className?: string;
}

type AppIconSize = "sm" | "md" | "lg";

const sizeConfig: Record<
  AppIconSize,
  {
    box: string;
    text: string;
    pixels: number;
    variants: [IconVariantWidth, IconVariantWidth];
  }
> = {
  sm: { box: "h-4 w-4", text: "text-[8px]", pixels: 16, variants: [64, 64] },
  md: { box: "h-8 w-8", text: "text-sm", pixels: 44, variants: [64, 128] },
  lg: { box: "h-18 w-18", text: "text-lg", pixels: 72, variants: [128, 256] },
};

const monogramStyles = [
  "rounded-[28%] bg-[#e8edf5] text-[#263b60] ring-1 ring-inset ring-[#263b60]/10",
  "rounded-full bg-[#2d5d50] text-[#f3f7ed] shadow-xs",
  "rounded-[25%_25%_25%_4%] bg-[#f7e7de] text-[#923c24] ring-1 ring-inset ring-[#923c24]/10",
  "rounded-[28%] bg-[#d4ab58] text-[#382d19] shadow-xs",
  "rounded-[4%_28%_4%_28%] bg-[#344353] text-[#f4f0e8] shadow-xs",
  "rounded-full bg-[#f5ecf0] text-[#704356] ring-1 ring-inset ring-[#b794a2]",
];

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => (Array.from(word)[0] ?? "").toUpperCase())
      .join("") || "?"
  );
}

export function AppIcon({
  icon,
  appName,
  size = "sm",
  priority = false,
  className,
}: AppIconProps) {
  const iconUrl = getIconUrl(icon);
  const [failure, setFailure] = useState<{
    iconUrl: string;
    stage: "variant" | "original";
  }>();
  const config = sizeConfig[size];
  const failedStage =
    failure && failure.iconUrl === iconUrl ? failure.stage : undefined;
  const [variant1x, variant2x] = config.variants.map((width) =>
    iconUrl ? getIconVariantUrl(iconUrl, width) : undefined,
  );
  // Fall back from the generated variant to the original file, then to a monogram.
  const useVariant = !!variant1x && !failedStage;
  const showFallback = !iconUrl || failedStage === "original";
  let hash = 0;
  for (const character of appName.trim().toLowerCase()) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return (
    <div
      className={cn(
        config.box,
        "rounded-sm flex items-center justify-center shrink-0",
        className,
      )}
    >
      {!showFallback ? (
        <img
          src={useVariant ? variant1x : iconUrl}
          srcSet={
            useVariant && variant2x !== variant1x
              ? `${variant1x} 1x, ${variant2x} 2x`
              : undefined
          }
          width={config.pixels}
          height={config.pixels}
          alt={`${appName} icon`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className="h-full w-full object-cover rounded-[inherit]"
          onError={() =>
            setFailure({
              iconUrl,
              stage: useVariant ? "variant" : "original",
            })
          }
        />
      ) : (
        <span
          role="img"
          aria-label={`${appName} icon`}
          className={cn(
            "flex size-full items-center justify-center font-mono font-semibold leading-none select-none",
            config.text,
            monogramStyles[hash % monogramStyles.length],
          )}
        >
          {getInitials(appName)}
        </span>
      )}
    </div>
  );
}
