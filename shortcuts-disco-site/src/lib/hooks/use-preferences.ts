"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/lib/services/user-service";
import type { UserPreferences } from "@/lib/model/user/user-models";

const defaultPreferences: UserPreferences = {
  platformFilter: null,
  viewMode: "list",
  columnCount: 4,
};

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(defaultPreferences);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await userService.getPreferences(user);
      setPreferences(data ?? defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    if (user) {
      await userService.updatePreferences(newPrefs, user);
    }
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
