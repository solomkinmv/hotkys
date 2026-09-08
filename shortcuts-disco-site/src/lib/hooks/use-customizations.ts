"use client";
import { useAccountData } from "@/components/auth/account-data-provider";
export function useCustomizations() {
  const account = useAccountData();
  return { customizations: account.data.customizations, isLoading: account.loading, error: account.errors.customizations, refetch: account.refetch };
}
