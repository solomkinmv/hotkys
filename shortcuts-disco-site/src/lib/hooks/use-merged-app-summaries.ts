"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { usePublicCatalog } from "@/lib/hooks/use-public-catalog";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import {
  type AppSummary,
  summarizeApps,
} from "@/lib/model/internal/app-summary";

/**
 * Applies the signed-in user's customizations to catalog summaries. Overlays
 * and added keymaps change public apps, so only then is the full catalog
 * fetched and merged; private apps merge without it.
 */
export function useMergedAppSummaries(baseApps: AppSummary[]) {
  const { user } = useAuth();
  const { customizations } = useCustomizations();
  const needsCatalog =
    !!user &&
    (customizations.shortcuts.length > 0 ||
      customizations.customKeymaps.length > 0);
  const { applications: catalog } = usePublicCatalog(needsCatalog);

  const applications = useMemo(() => {
    if (!user) return baseApps;
    const merger = new ShortcutMerger(customizations);
    if (needsCatalog && catalog) {
      return summarizeApps(merger.mergeShortcuts(catalog, customizations));
    }
    const customApps = summarizeApps(merger.mergeShortcuts([], customizations));
    return customApps.length ? [...baseApps, ...customApps] : baseApps;
  }, [baseApps, user, customizations, needsCatalog, catalog]);

  return { applications };
}
