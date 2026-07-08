import { createClientOrNull } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/auth/types";
import type { Favorite } from "@/lib/model/user/user-models";
import {
  getCurrentProfile,
  requireCurrentProfile,
} from "@/lib/services/current-profile";

export class FavoritesService {
  async getFavorites(authUser?: AuthUser | null): Promise<Favorite[]> {
    const supabase = createClientOrNull();
    if (!supabase) return [];

    const profile = await getCurrentProfile(authUser);
    if (!profile) return [];

    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      itemType: row.item_type,
      appSlug: row.app_slug,
      keymapTitle: row.keymap_title,
      shortcutTitle: row.shortcut_title,
      sectionTitle: row.section_title,
      customAppId: row.custom_app_id,
    }));
  }

  async addFavorite(
    favorite: Omit<Favorite, "id" | "userId">,
    authUser?: AuthUser | null
  ): Promise<Favorite> {
    const supabase = createClientOrNull();
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id: profile.id,
        item_type: favorite.itemType,
        app_slug: favorite.appSlug ?? null,
        keymap_title: favorite.keymapTitle ?? null,
        shortcut_title: favorite.shortcutTitle ?? null,
        section_title: favorite.sectionTitle ?? null,
        custom_app_id: favorite.customAppId ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      itemType: data.item_type,
      appSlug: data.app_slug,
      keymapTitle: data.keymap_title,
      shortcutTitle: data.shortcut_title,
      sectionTitle: data.section_title,
      customAppId: data.custom_app_id,
    };
  }

  async removeFavorite(id: string, authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull();
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id);

    if (error) throw error;
  }

  async toggleFavorite(
    favorite: Omit<Favorite, "id" | "userId">,
    authUser?: AuthUser | null
  ): Promise<boolean> {
    const supabase = createClientOrNull();
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    let query = supabase
      .from("favorites")
      .select("id")
      .eq("user_id", profile.id)
      .eq("item_type", favorite.itemType);

    query = applyNullableFilter(query, "app_slug", favorite.appSlug);
    query = applyNullableFilter(query, "keymap_title", favorite.keymapTitle);
    query = applyNullableFilter(query, "shortcut_title", favorite.shortcutTitle);
    query = applyNullableFilter(query, "section_title", favorite.sectionTitle);
    query = applyNullableFilter(query, "custom_app_id", favorite.customAppId);

    const { data: existing, error } = await query.maybeSingle();

    if (error) throw error;

    if (existing) {
      await this.removeFavorite(existing.id, authUser);
      return false;
    } else {
      await this.addFavorite(favorite, authUser);
      return true;
    }
  }
}

export const favoritesService = new FavoritesService();

function applyNullableFilter<T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T }>(
  query: T,
  column: string,
  value: string | null | undefined
): T {
  if (value == null) {
    return query.is(column, null);
  }

  return query.eq(column, value);
}
