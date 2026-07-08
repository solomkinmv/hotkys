import { getCurrentAuthUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { createClientOrNull } from "@/lib/supabase/client";

export interface CurrentProfile {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
  createdAt: string;
}

let cachedProfile: CurrentProfile | null = null;
let cachedProfilePromise: Promise<CurrentProfile | null> | null = null;

export function clearCurrentProfileCache() {
  cachedProfile = null;
  cachedProfilePromise = null;
}

export async function getCurrentProfile(
  authUser?: AuthUser | null
): Promise<CurrentProfile | null> {
  const user = authUser === undefined ? getCurrentAuthUser() : authUser;
  if (!user) {
    clearCurrentProfileCache();
    return null;
  }

  if (cachedProfile?.clerkUserId === user.id) {
    return cachedProfile;
  }

  if (cachedProfilePromise) {
    return cachedProfilePromise;
  }

  cachedProfilePromise = ensureCurrentProfile(user).finally(() => {
    cachedProfilePromise = null;
  });

  cachedProfile = await cachedProfilePromise;
  return cachedProfile;
}

export async function requireCurrentProfile(
  authUser?: AuthUser | null
): Promise<CurrentProfile> {
  const profile = await getCurrentProfile(authUser);
  if (!profile) {
    throw new Error("Not authenticated");
  }

  return profile;
}

async function ensureCurrentProfile(
  user: NonNullable<ReturnType<typeof getCurrentAuthUser>>
): Promise<CurrentProfile | null> {
  const supabase = createClientOrNull();
  if (!supabase) return null;

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return mapCurrentProfile(existing, user.email);

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      clerk_user_id: user.id,
      display_name: user.displayName ?? user.email?.split("@")[0] ?? null,
      avatar_url: user.avatarUrl,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: conflictedProfile, error: conflictSelectError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("clerk_user_id", user.id)
          .maybeSingle();

      if (conflictSelectError) throw conflictSelectError;
      if (conflictedProfile) {
        return mapCurrentProfile(conflictedProfile, user.email);
      }
    }

    throw error;
  }

  return mapCurrentProfile(data, user.email);
}

function mapCurrentProfile(
  data: Record<string, string | null>,
  email: string | null
): CurrentProfile {
  return {
    id: data.id as string,
    clerkUserId: data.clerk_user_id as string,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    email: email ?? "",
    createdAt: data.created_at as string,
  };
}
