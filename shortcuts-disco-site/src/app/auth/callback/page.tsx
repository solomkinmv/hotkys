import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function AuthCallbackPage() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-8 sm:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Let’s get you back in
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Start a fresh sign-in.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This sign-in link is no longer active. Start again to access your
        favorites and private shortcuts.
      </p>
      <Button asChild className="mt-7 rounded-xl">
        <Link href="/auth/login">Sign In</Link>
      </Button>
    </section>
  );
}
