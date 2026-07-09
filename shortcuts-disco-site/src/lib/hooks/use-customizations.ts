"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { customizationsService } from "@/lib/services/customizations-service";
import type { UserCustomizations } from "@/lib/model/user/user-models";

const emptyCustomizations: UserCustomizations = {
  customApps: [],
  customKeymaps: [],
  shortcuts: [],
  favorites: [],
};

export function useCustomizations() {
  const { user } = useAuth();
  const [customizations, setCustomizations] =
    useState<UserCustomizations>(emptyCustomizations);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomizations = useCallback(async () => {
    if (!user) {
      setCustomizations(emptyCustomizations);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await customizationsService.getAllCustomizations(user);
      setCustomizations(data);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomizations();
  }, [fetchCustomizations]);

  return {
    customizations,
    isLoading,
    refetch: fetchCustomizations,
  };
}
