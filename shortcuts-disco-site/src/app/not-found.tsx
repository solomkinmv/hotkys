import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-8 sm:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Page not found
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        This page doesn’t exist.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The link may be outdated or mistyped. Head back to the app catalog.
      </p>
      <Button asChild className="mt-7 rounded-xl">
        <Link href="/#applications">Browse apps</Link>
      </Button>
    </section>
  );
}
