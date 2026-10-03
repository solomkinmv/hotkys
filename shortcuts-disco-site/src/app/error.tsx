"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-8 sm:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        A small interruption
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Let’s try that again.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This page couldn’t load. Try again, or head back to the app catalog.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={reset} className="rounded-xl">
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/#applications">Browse apps</Link>
        </Button>
      </div>
    </section>
  );
}
