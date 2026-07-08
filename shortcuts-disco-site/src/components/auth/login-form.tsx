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
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
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
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none border rounded-md",
          },
        }}
      />
    </div>
  );
}
