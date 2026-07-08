import { createClientOrNull } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/auth/types";
import type { UserProfile, UserPreferences } from "@/lib/model/user/user-models";
import { getCurrentAuthUser } from "@/lib/auth/session";
import {
  clearCurrentProfileCache,
  getCurrentProfile,
  requireCurrentProfile,
  type CurrentProfile,
} from "@/lib/services/current-profile";

export class UserService {
  async getProfile(authUser?: AuthUser | null): Promise<UserProfile | null> {
    const profile = await getCurrentProfile(authUser);
    return profile ? this.mapProfile(profile, authUser) : null;
  }

  async updateProfile(
    updates: Pick<UserProfile, "displayName" | "avatarUrl">,
    authUser?: AuthUser | null
  ): Promise<void> {
    const supabase = createClientOrNull();
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) throw error;
    clearCurrentProfileCache();
  }

  async getPreferences(authUser?: AuthUser | null): Promise<UserPreferences | null> {
    const supabase = createClientOrNull();
    if (!supabase) return null;

    const profile = await getCurrentProfile(authUser);
    if (!profile) return null;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (error) throw error;

    return data
      ? {
          platformFilter: data.platform_filter,
          viewMode: data.view_mode,
          columnCount: data.column_count,
        }
      : {
          platformFilter: null,
          viewMode: "list",
          columnCount: 4,
        };
  }

  async updatePreferences(
    prefs: Partial<UserPreferences>,
    authUser?: AuthUser | null
  ): Promise<void> {
    const supabase = createClientOrNull();
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: profile.id,
      platform_filter: prefs.platformFilter,
      view_mode: prefs.viewMode,
      column_count: prefs.columnCount,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  private mapProfile(
    profile: CurrentProfile,
    authUser?: AuthUser | null
  ): UserProfile {
    const user = authUser === undefined ? getCurrentAuthUser() : authUser;
    return {
      id: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      email: user?.email ?? profile.email,
      createdAt: profile.createdAt,
    };
  }
}

export const userService = new UserService();
