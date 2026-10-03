"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccountPage } from "@/components/auth/account-page";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import type { UserPreferences } from "@/lib/model/user/user-models";
import type { Platform } from "@/lib/model/internal/internal-models";

const PLATFORMS: { value: Platform | null; label: string }[] = [
  { value: null, label: "All platforms" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
];
export function SettingsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    preferences,
    isLoading,
    error: syncError,
    updatePreferences,
  } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const previousSyncError = useRef(syncError);
  useEffect(() => {
    if (previousSyncError.current && !syncError) {
      setError(null);
      setNotice("Preferences saved.");
    }
    previousSyncError.current = syncError;
  }, [syncError]);
  const save = async (patch: Partial<UserPreferences>) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setNotice("");
    try {
      await updatePreferences(patch);
      setNotice("Preferences saved.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn’t save preferences. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <AccountPage
      title="Find your rhythm."
      description="Set your defaults. Spend more time using shortcuts and less time finding them."
    >
      {authLoading || isLoading ? (
        <div
          role="status"
          aria-label="Loading settings"
          className="h-96 animate-pulse rounded-2xl border bg-muted/40"
        />
      ) : !user ? (
        <div className="rounded-2xl border bg-card p-7">
          <h2 className="text-xl font-semibold">Make Hotkys work your way.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to save your preferences across visits.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href={getLoginHref("/settings")}>Sign In</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y rounded-2xl border bg-card px-6 sm:px-8">
          <fieldset disabled={saving || !!syncError} className="py-7">
            <legend className="sr-only">Default platform</legend>
            <h2 className="text-lg font-semibold tracking-tight">
              Your platform
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Start with shortcuts for the operating system you use.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <Button
                  key={platform.label}
                  type="button"
                  variant={
                    preferences.platformFilter === platform.value
                      ? "default"
                      : "outline"
                  }
                  aria-pressed={preferences.platformFilter === platform.value}
                  className="rounded-xl"
                  onClick={() => void save({ platformFilter: platform.value })}
                >
                  {platform.label}
                </Button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={saving || !!syncError} className="py-7">
            <legend className="sr-only">Default view</legend>
            <h2 className="text-lg font-semibold tracking-tight">
              Your preferred view
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Browse one action at a time, or see the whole cheatsheet.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "list",
                    label: "List",
                    description: "Room to read every action and instruction.",
                  },
                  {
                    value: "cheatsheet",
                    label: "Cheatsheet",
                    description: "A compact reference for quick scanning.",
                  },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  aria-pressed={preferences.viewMode === mode.value}
                  onClick={() => void save({ viewMode: mode.value })}
                  className={`rounded-xl border p-4 text-left transition-colors hover:border-brand/40 disabled:opacity-50 ${preferences.viewMode === mode.value ? "border-brand/40 bg-brand/5" : "bg-background"}`}
                >
                  <span className="block font-medium">{mode.label}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                    {mode.description}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={saving || !!syncError} className="py-7">
            <legend className="sr-only">Cheatsheet columns</legend>
            <h2 className="text-lg font-semibold tracking-tight">
              Cheatsheet columns
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Choose your ideal density. Smaller screens use fewer columns.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant={
                    preferences.columnCount === count ? "default" : "outline"
                  }
                  aria-pressed={preferences.columnCount === count}
                  aria-label={`${count} ${count === 1 ? "column" : "columns"}`}
                  className="size-11 rounded-xl"
                  onClick={() => void save({ columnCount: count })}
                >
                  {count}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="py-5 text-sm">
            <p
              role={error || syncError ? "alert" : "status"}
              className={
                error || syncError
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
            >
              {error ??
                syncError ??
                (saving
                  ? "Saving preferences…"
                  : notice || "Changes save automatically.")}
            </p>
          </div>
        </div>
      )}
    </AccountPage>
  );
}
