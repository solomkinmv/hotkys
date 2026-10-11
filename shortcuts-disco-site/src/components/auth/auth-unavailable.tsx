"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function AuthUnavailableNotice({
  headingLevel: Heading = "h1",
}: {
  headingLevel?: "h1" | "h2";
}) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-xl rounded-2xl border bg-card p-8 sm:p-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        A small interruption
      </p>
      <Heading className="mt-4 text-3xl font-semibold tracking-tight">
        Sign-in is out of reach.
      </Heading>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Couldn’t reach sign-in. Check your connection or ad blocker and retry.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={() => window.location.reload()} className="rounded-xl">
          Retry
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/#applications">Browse apps</Link>
        </Button>
      </div>
    </section>
  );
}

/** Replaces account-only content with a retry notice when Clerk cannot load. */
export function AuthUnavailableGate({ children }: { children: ReactNode }) {
  const { isUnavailable } = useAuth();
  return isUnavailable ? <AuthUnavailableNotice /> : children;
}
