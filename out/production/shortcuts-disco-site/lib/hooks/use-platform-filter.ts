"use client";

import { Platform } from "@/lib/model/internal/internal-models";
import { useEffect, useState } from "react";

const STORAGE_KEY = "platform-filter";
const ALL_PLATFORMS: Platform[] = ["windows", "linux", "macos"];

/**
 * Custom hook for managing platform filter state with localStorage persistence
 * @returns Platform filter state and setter function
 */
export function usePlatformFilter() {
  const [platformFilters, setPlatformFilters] = useState<Set<Platform>>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Platform[];
          return new Set(parsed);
        }
      } catch (error) {
        console.error("Failed to parse platform filter from localStorage:", error);
      }
    }
    // Default: all platforms enabled
    return new Set(ALL_PLATFORMS);
  });

  // Persist to localStorage whenever filter changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([...platformFilters])
        );
      } catch (error) {
        console.error("Failed to save platform filter to localStorage:", error);
      }
    }
  }, [platformFilters]);

  return { platformFilters, setPlatformFilters };
}
