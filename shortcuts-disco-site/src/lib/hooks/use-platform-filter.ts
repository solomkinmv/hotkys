"use client";

import { Platform } from "@/lib/model/internal/internal-models";
import { useEffect, useState } from "react";

const STORAGE_KEY = "platform-filter";

/**
 * Custom hook for managing platform filter state with localStorage persistence
 * @returns Platform filter state (null = all platforms) and setter function
 */
export function usePlatformFilter() {
  const [platformFilter, setPlatformFilter] = useState<Platform | null>(() => {
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

  return { platformFilter, setPlatformFilter };
}
