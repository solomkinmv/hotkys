"use client";

import { useCallback, useEffect, useState } from "react";
import { loadPublicCatalog } from "@/lib/load/public-catalog";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";

/** Lazily loads the full public catalog once `enabled` becomes true. */
export function usePublicCatalog(enabled: boolean) {
  const [applications, setApplications] = useState<AppShortcuts[]>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadPublicCatalog().then(
      (catalog) => {
        if (active) setApplications(catalog);
      },
      (reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Couldn’t load the shortcut catalog.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setError(undefined);
    setAttempt((value) => value + 1);
  }, []);

  return {
    applications,
    isLoading: enabled && !applications && !error,
    error,
    retry,
  };
}
