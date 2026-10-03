"use client";
import { useCallback } from "react";
import { useAccountData } from "@/components/auth/account-data-provider";
export function useCustomizations() {
  const account = useAccountData();
  const { refreshAfterWrite } = account;
  const refetch = useCallback(
    () => refreshAfterWrite(["customizations"]),
    [refreshAfterWrite],
  );
  return {
    customizations: account.data.customizations,
    isLoading: account.loading,
    error: account.errors.customizations,
    refetch,
  };
}
