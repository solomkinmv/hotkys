import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Error",
};

export default function AuthErrorPage() {
  return (
    <section className="mx-auto max-w-sm text-center">
      <TypographyH1 className="mb-2">Something went wrong</TypographyH1>
      <TypographyMuted className="mb-6">
        We couldn&apos;t sign you in. Please try again.
      </TypographyMuted>
      <Button asChild>
        <Link href="/auth/login">Try again</Link>
      </Button>
    </section>
  );
}
