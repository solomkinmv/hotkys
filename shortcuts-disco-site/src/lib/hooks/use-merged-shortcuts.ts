"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";

export function useMergedShortcuts(baseApps: AppShortcuts[]) {
  const { user } = useAuth();
  const { customizations, isLoading } = useCustomizations();

  const mergedApps = useMemo(() => {
    if (!user || !customizations) {
      return baseApps;
    }

    const merger = new ShortcutMerger(customizations);
    return merger.mergeShortcuts(baseApps, customizations);
  }, [baseApps, user, customizations]);

  return {
    applications: mergedApps,
    isLoading,
    isAuthenticated: !!user,
  };
}
