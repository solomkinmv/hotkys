"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";

export default function AuthCallbackPage() {
  return (
    <section className="mx-auto max-w-md text-center">
      <TypographyH1 className="mb-4">Sign-in link expired</TypographyH1>
      <TypographyMuted className="mb-6">
        Hotkys now uses Clerk for sign in. Start a new sign-in flow to continue.
      </TypographyMuted>
      <Button asChild>
        <Link href="/auth/login">Sign In</Link>
      </Button>
    </section>
  );
}
