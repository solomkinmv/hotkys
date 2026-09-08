import { matchesFavorite } from "@/lib/shortcut-core/favorites";
import { createClientOrNull } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/auth/types";
import type { Favorite } from "@/lib/model/user/user-models";
import {
  getCurrentProfile,
  requireCurrentProfile,
} from "@/lib/services/current-profile";
import { validateFavoriteMetadata } from "@/lib/validation/user-content";

export class FavoritesService {
  async getFavorites(authUser?: AuthUser | null): Promise<Favorite[]> {
    const supabase = createClientOrNull(authUser);
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
      baseShortcutId: row.base_shortcut_id,
      customAppId: row.custom_app_id ?? undefined,
      customKeymapId: row.custom_keymap_id ?? undefined,
      customShortcutId: row.custom_shortcut_id ?? undefined,
    }));
  }

  async addFavorite(
    favorite: Omit<Favorite, "id" | "userId">,
    authUser?: AuthUser | null
  ): Promise<Favorite> {
    validateFavoriteMetadata(favorite);
    const supabase = createClientOrNull(authUser);
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
        base_shortcut_id: favorite.baseShortcutId ?? null,
        custom_app_id: favorite.customAppId ?? null,
        custom_keymap_id: favorite.customKeymapId ?? null,
        custom_shortcut_id: favorite.customShortcutId ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505" || error.code === "23514") {
        const existing = (await this.getFavorites(authUser)).find(row => matchesFavorite(row, favorite));
        if (existing) return existing;
      }
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      itemType: data.item_type,
      appSlug: data.app_slug,
      keymapTitle: data.keymap_title,
      shortcutTitle: data.shortcut_title,
      sectionTitle: data.section_title,
      baseShortcutId: data.base_shortcut_id,
      customAppId: data.custom_app_id ?? undefined,
      customKeymapId: data.custom_keymap_id ?? undefined,
      customShortcutId: data.custom_shortcut_id ?? undefined,
    };
  }

  async removeFavorite(id: string, authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull(authUser);
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
    validateFavoriteMetadata(favorite);
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    await requireCurrentProfile(authUser);

    const existing = (await this.getFavorites(authUser)).find(row => matchesFavorite(row, favorite));

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
