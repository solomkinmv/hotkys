import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sign-in interrupted" };
export default function AuthErrorPage() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-8 sm:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Sign-in interrupted
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        One more try.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        We couldn’t sign you in. Try again to get back to your favorites and
        private shortcuts.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button asChild className="rounded-xl">
          <Link href="/auth/login">Try signing in again</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/#applications">Browse apps</Link>
        </Button>
      </div>
    </section>
  );
}
