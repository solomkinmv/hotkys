"use client";
import { useAccountData } from "@/components/auth/account-data-provider";
export function useProfile() {
  const account = useAccountData();
  return { profile: account.data.profile, isLoading: account.loading, error: account.errors.profile, refetch: account.refetch, updateProfile: account.updateProfile };
}
