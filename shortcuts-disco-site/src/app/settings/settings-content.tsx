"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/components/ui/typography";
import type { Platform } from "@/lib/model/internal/internal-models";

const PLATFORMS: { value: Platform | "all"; label: string }[] = [
  { value: "all", label: "All Platforms" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
];

const VIEW_MODES: { value: "list" | "cheatsheet"; label: string }[] = [
  { value: "list", label: "List" },
  { value: "cheatsheet", label: "Cheatsheet" },
];

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];

export function SettingsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { preferences, isLoading: prefsLoading, updatePreferences } = usePreferences();

  if (authLoading || prefsLoading) {
    return (
      <section className="mx-auto max-w-md">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Settings</TypographyH1>
        <TypographyMuted className="mb-6">
          Sign in to save your preferences
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref("/settings")}>Sign In</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md">
      <TypographyH1 className="mb-6">Settings</TypographyH1>

      <div className="space-y-8">
        <div className="space-y-3">
          <TypographyH3>Default Platform</TypographyH3>
          <TypographyMuted className="text-sm">
            Filter shortcuts by platform
          </TypographyMuted>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <Button
                key={platform.value}
                variant={
                  (platform.value === "all" && !preferences.platformFilter) ||
                  preferences.platformFilter === platform.value
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() =>
                  updatePreferences({
                    platformFilter:
                      platform.value === "all" ? null : platform.value,
                  })
                }
              >
                {platform.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <TypographyH3>Default View</TypographyH3>
          <TypographyMuted className="text-sm">
            Choose how shortcuts are displayed
          </TypographyMuted>
          <div className="flex gap-2">
            {VIEW_MODES.map((mode) => (
              <Button
                key={mode.value}
                variant={
                  preferences.viewMode === mode.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => updatePreferences({ viewMode: mode.value })}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <TypographyH3>Cheatsheet Columns</TypographyH3>
          <TypographyMuted className="text-sm">
            Number of columns in cheatsheet view
          </TypographyMuted>
          <div className="flex gap-2">
            {COLUMN_OPTIONS.map((count) => (
              <Button
                key={count}
                variant={
                  preferences.columnCount === count ? "default" : "outline"
                }
                size="sm"
                onClick={() => updatePreferences({ columnCount: count })}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
