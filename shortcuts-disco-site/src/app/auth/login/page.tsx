import { LoginForm } from "@/components/auth/login-form";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm">
      <div className="text-center mb-8">
        <TypographyH1 className="mb-2">Sign In</TypographyH1>
        <TypographyMuted>
          Sign in to save your favorites and custom shortcuts
        </TypographyMuted>
      </div>
      <Suspense
        fallback={
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Loading sign in...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}
