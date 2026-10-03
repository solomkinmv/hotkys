"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountPage } from "@/components/auth/account-page";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useProfile } from "@/lib/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER_CONTENT_LIMITS } from "@/lib/validation/user-content";

export function EditProfileContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    error: loadError,
    refetch,
    updateProfile,
  } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDisplayName(
      profile?.displayName ??
        user?.displayName ??
        user?.email?.split("@")[0] ??
        "",
    );
  }, [profile?.displayName, user?.displayName, user?.email]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !displayName.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarUrl: profile?.avatarUrl ?? null,
      });
      router.push("/profile");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn’t save your profile. Your changes are still here.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <AccountPage
      title="A little more you."
      description="Choose the name that appears on your profile."
    >
      {authLoading || profileLoading ? (
        <div
          role="status"
          aria-label="Loading profile"
          className="h-80 animate-pulse rounded-2xl border bg-muted/40"
        />
      ) : !user ? (
        <div className="rounded-2xl border bg-card p-7">
          <p className="text-sm text-muted-foreground">
            Sign in to edit your profile.
          </p>
          <Button asChild className="mt-5 rounded-xl">
            <Link href={getLoginHref("/profile/edit")}>Sign In</Link>
          </Button>
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border bg-card p-7">
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => void refetch().catch(() => {})}
          >
            Retry loading
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-card p-7 sm:p-9"
        >
          <Avatar className="mb-8 size-20 rounded-2xl">
            <AvatarImage
              src={profile?.avatarUrl ?? user.avatarUrl ?? undefined}
              alt="Your avatar"
            />
            <AvatarFallback className="rounded-2xl bg-brand/10 text-2xl text-brand">
              {Array.from(displayName)[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="max-w-lg space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                maxLength={USER_CONTENT_LIMITS.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isSaving}
                placeholder="Your name"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email ?? ""}
                disabled
                className="h-12 rounded-xl"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Managed by your sign-in account.
              </p>
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-5 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
            <Button
              type="submit"
              disabled={isSaving || !displayName.trim()}
              className="rounded-xl"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              asChild
              className="rounded-xl"
            >
              <Link href="/profile">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </AccountPage>
  );
}
