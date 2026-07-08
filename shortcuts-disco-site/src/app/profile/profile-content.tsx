"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useProfile } from "@/lib/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import { Pencil } from "lucide-react";

export function ProfileContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <section className="mx-auto max-w-md">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 rounded-full bg-muted mx-auto" />
          <div className="h-8 bg-muted rounded w-48 mx-auto" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Profile</TypographyH1>
        <TypographyMuted className="mb-6">
          Sign in to view your profile
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref("/profile")}>Sign In</Link>
        </Button>
      </section>
    );
  }

  const displayName =
    profile?.displayName ?? user.displayName ?? user.email?.split("@")[0] ?? "User";
  const initials = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatarUrl ?? user.avatarUrl;

  return (
    <section className="mx-auto max-w-md">
      <div className="text-center space-y-4">
        <Avatar className="h-24 w-24 mx-auto">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div>
          <TypographyH1 className="mb-1">{displayName}</TypographyH1>
          <TypographyMuted>{user.email}</TypographyMuted>
        </div>

        <div className="pt-4">
          <Button variant="outline" asChild>
            <Link href="/profile/edit">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="pt-8 grid gap-2 text-left">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Member since</span>
            <span>
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
