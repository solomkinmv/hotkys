"use client";

import { SignIn } from "@clerk/react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { getSafeAuthRedirectPath } from "@/lib/auth/redirect";

export function LoginForm() {
  const { isConfigured } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeAuthRedirectPath(searchParams.get("next"));

  if (!isConfigured) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        Sign in is not configured for this deployment yet.
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <SignIn
        routing="hash"
        forceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
        withSignUp
        oauthFlow="redirect"
        appearance={{
          variables: {
            colorPrimary: "hsl(var(--brand))",
            colorPrimaryForeground: "hsl(var(--primary-foreground))",
            colorNeutral: "hsl(var(--foreground))",
            colorBackground: "hsl(var(--card))",
            colorForeground: "hsl(var(--foreground))",
            colorMutedForeground: "hsl(var(--muted-foreground))",
            colorInput: "hsl(var(--background))",
            colorInputForeground: "hsl(var(--foreground))",
            fontFamily: "inherit",
            borderRadius: "0.75rem",
          },
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none border rounded-2xl",
          },
        }}
      />
    </div>
  );
}
