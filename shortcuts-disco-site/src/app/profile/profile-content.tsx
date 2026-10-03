"use client";

import Link from "next/link";
import { Pencil, ArrowRight } from "lucide-react";
import { AccountPage } from "@/components/auth/account-page";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useProfile } from "@/lib/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ProfileContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, error, refetch } = useProfile();
  const displayName =
    profile?.displayName ??
    user?.displayName ??
    user?.email?.split("@")[0] ??
    "Your profile";
  return (
    <AccountPage
      title="Make yourself at home."
      description="Your profile, preferences, and shortcut collection. All in one place."
    >
      {authLoading || profileLoading ? (
        <div
          role="status"
          aria-label="Loading profile"
          className="h-72 animate-pulse rounded-2xl border bg-muted/40"
        />
      ) : !user ? (
        <div className="rounded-2xl border bg-card p-7 sm:p-9">
          <h2 className="text-xl font-semibold">Your own corner of Hotkys.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in to save favorites, create private apps, and make Hotkys work
            your way.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href={getLoginHref("/profile")}>
              Sign In <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border bg-card p-7">
          <h2 className="text-xl font-semibold">Couldn’t load your profile</h2>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-5 rounded-xl"
            onClick={() => void refetch().catch(() => {})}
          >
            Retry loading
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card p-7 sm:p-9">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-20 shrink-0 rounded-2xl">
                <AvatarImage
                  src={profile?.avatarUrl ?? user.avatarUrl ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback className="rounded-2xl bg-brand/10 text-2xl text-brand">
                  {Array.from(displayName)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-2xl font-semibold tracking-tight">
                  {displayName}
                </h2>
                <p className="mt-2 break-all text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Button variant="outline" asChild className="shrink-0 rounded-xl">
                <Link href="/profile/edit">
                  <Pencil aria-hidden="true" className="size-4" />
                  Edit profile
                </Link>
              </Button>
            </div>
            {profile?.createdAt && (
              <div className="mt-8 flex flex-wrap justify-between gap-2 border-t pt-5 text-sm">
                <span className="text-muted-foreground">Member since</span>
                <span>
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              {
                href: "/favorites",
                title: "Keep your favorites close.",
                text: "Jump back to the apps and actions you use most.",
              },
              {
                href: "/my-shortcuts",
                title: "Build your own collection.",
                text: "Create private apps and shortcuts that fit your workflow.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border p-6 transition-colors hover:border-brand/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold tracking-tight">{item.title}</h3>
                  <ArrowRight
                    className="size-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </AccountPage>
  );
}
