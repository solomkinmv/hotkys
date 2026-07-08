"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useProfile } from "@/lib/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";

export function EditProfileContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    } else if (user?.displayName) {
      setDisplayName(user.displayName);
    } else if (user?.email) {
      setDisplayName(user.email.split("@")[0]);
    }
  }, [profile, user]);

  if (authLoading || profileLoading) {
    return (
      <section className="mx-auto max-w-md">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Edit Profile</TypographyH1>
        <TypographyMuted className="mb-6">
          Sign in to edit your profile
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref("/profile/edit")}>Sign In</Link>
        </Button>
      </section>
    );
  }

  const avatarUrl = profile?.avatarUrl ?? user.avatarUrl;
  const initials = displayName.charAt(0).toUpperCase() || "U";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        avatarUrl: profile?.avatarUrl ?? null,
      });
      router.push("/profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <TypographyH1 className="mb-6">Edit Profile</TypographyH1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email ?? ""} disabled />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/profile">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSaving} className="flex-1">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
