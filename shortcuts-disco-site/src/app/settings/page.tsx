import { AuthUnavailableGate } from "@/components/auth/auth-unavailable";
import { SettingsContent } from "./settings-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default function SettingsPage() {
  return (
    <AuthUnavailableGate>
      <SettingsContent />
    </AuthUnavailableGate>
  );
}
