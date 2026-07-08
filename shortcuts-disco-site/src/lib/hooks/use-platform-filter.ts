"use client";

import { Platform } from "@/lib/model/internal/internal-models";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { usePreferences } from "@/lib/hooks/use-preferences";

const STORAGE_KEY = "platform-filter";

/**
 * Custom hook for managing platform filter state with localStorage persistence
 * @returns Platform filter state (null = all platforms) and setter function
 */
export function usePlatformFilter() {
  const { user } = useAuth();
  const { preferences, isLoading, updatePreferences } = usePreferences();
  const [localPlatformFilter, setLocalPlatformFilter] =
    useState<Platform | null>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed === "all" ? null : (parsed as Platform);
        }
      } catch (error) {
        console.error("Failed to parse platform filter from localStorage:", error);
      }
    }
    // Default: all platforms (null)
    return null;
  });

  const platformFilter =
    user && !isLoading ? preferences.platformFilter : localPlatformFilter;

  // Persist to localStorage whenever filter changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(platformFilter === null ? "all" : platformFilter)
        );
      } catch (error) {
        console.error("Failed to save platform filter to localStorage:", error);
      }
    }
  }, [platformFilter]);

  const updatePlatformFilter = useCallback(
    (filter: Platform | null) => {
      setLocalPlatformFilter(filter);
      if (user && !isLoading) {
        void updatePreferences({ platformFilter: filter }).catch((error) => {
          console.error("Failed to save platform preference:", error);
        });
      }
    },
    [user, isLoading, updatePreferences]
  );

  return { platformFilter, setPlatformFilter: updatePlatformFilter };
}
