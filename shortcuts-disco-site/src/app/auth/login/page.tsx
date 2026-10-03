import { LoginForm } from "@/components/auth/login-form";
import { ArrowLeft, FolderEdit, Star } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign In" };
export default function LoginPage() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-10 py-4 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-12">
      <div>
        <Link
          href="/#applications"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to apps
        </Link>
        <p className="mb-4 text-sm font-medium text-brand">
          Your setup, saved.
        </p>
        <h1 className="max-w-md text-4xl leading-[1.1] font-semibold tracking-[-0.055em] md:text-5xl">
          Make Hotkys yours.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Keep your everyday shortcuts close and build a collection that works
          the way you do.
        </p>
        <div className="mt-8 space-y-5">
          <div className="flex items-start gap-3">
            <Star
              className="mt-0.5 size-5 shrink-0 text-brand"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-medium">
                A place for your favorites
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Save apps and shortcuts to find them again in seconds.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FolderEdit
              className="mt-0.5 size-5 shrink-0 text-brand"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-medium">
                Shortcuts that fit your workflow
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Add private apps and customize your key combinations.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <Suspense
          fallback={
            <div
              role="status"
              className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground"
            >
              Loading sign in…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
