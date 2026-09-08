"use client";
import { useAccountData } from "@/components/auth/account-data-provider";
export function usePreferences() {
  const account = useAccountData();
  return { preferences: account.data.preferences, isLoading: account.loading, error: account.errors.preferences, refetch: account.refetch, updatePreferences: account.updatePreferences };
}
