import { createClientOrNull } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/auth/types";
import type {
  CustomApp,
  CustomKeymap,
  CustomSection,
  CustomShortcut,
  ShortcutOverlay,
  UserCustomizations,
} from "@/lib/model/user/user-models";
import {
  getCurrentProfile,
  requireCurrentProfile,
} from "@/lib/services/current-profile";
import {
  normalizeCustomShortcutDraft,
  validateCustomShortcutDraft,
} from "@/lib/services/custom-shortcut-validation";
import {
  validateCustomAppMetadata,
  validateCustomKeymapMetadata,
  validateCustomSectionMetadata,
  validateShortcutStorageMetadata,
} from "@/lib/validation/user-content";

interface BaseAppShortcutInput {
  baseAppSlug: string;
  keymapTitle: string;
  sectionTitle: string;
  title: string;
  key?: string;
  comment?: string;
}

interface CustomShortcutUpdateInput {
  title: string;
  key?: string;
  comment?: string;
}

interface CustomAppUpdateInput {
  slug?: string;
  name?: string;
  bundleId?: string | null;
  hostname?: string | null;
  source?: string | null;
  icon?: string | null;
}

export class CustomizationsService {
  async getAllCustomizations(
    authUser?: AuthUser | null
  ): Promise<UserCustomizations> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) {
      return { customApps: [], customKeymaps: [], shortcuts: [], favorites: [] };
    }

    const profile = await getCurrentProfile(authUser);
    if (!profile) {
      return { customApps: [], customKeymaps: [], shortcuts: [], favorites: [] };
    }

    const [appsResult, keymapsResult, shortcutsResult] = await Promise.all([
      supabase
        .from("custom_apps")
        .select(
          `
          *,
          custom_keymaps (
            *,
            custom_sections (
              *,
              custom_shortcuts (*)
            )
          )
        `
        )
        .eq("user_id", profile.id),
      supabase
        .from("custom_keymaps")
        .select(
          `
          *,
          custom_sections (
            *,
            custom_shortcuts (*)
          )
        `
        )
        .eq("user_id", profile.id)
        .not("base_app_slug", "is", null),
      supabase
        .from("custom_shortcuts")
        .select("*")
        .eq("user_id", profile.id)
        .not("base_app_slug", "is", null),
    ]);

    if (appsResult.error) throw appsResult.error;
    if (keymapsResult.error) throw keymapsResult.error;
    if (shortcutsResult.error) throw shortcutsResult.error;

    return {
      customApps: this.mapCustomApps(appsResult.data ?? []),
      customKeymaps: this.mapCustomKeymaps(
        (keymapsResult.data as Record<string, unknown>[]) ?? []
      ),
      shortcuts: this.mapShortcutOverlays(shortcutsResult.data ?? []),
      favorites: [],
    };
  }

  async createCustomApp(
    app: Omit<CustomApp, "id" | "userId" | "keymaps">,
    authUser?: AuthUser | null
  ): Promise<CustomApp> {
    validateCustomAppMetadata(app);
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { data, error } = await supabase
      .from("custom_apps")
      .insert({
        user_id: profile.id,
        slug: app.slug,
        name: app.name,
        bundle_id: app.bundleId ?? null,
        hostname: app.hostname ?? null,
        source: app.source ?? null,
        icon: app.icon ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      slug: data.slug,
      name: data.name,
      bundleId: data.bundle_id,
      hostname: data.hostname,
      source: data.source,
      icon: data.icon,
      keymaps: [],
    };
  }

  async updateCustomApp(
    id: string,
    updates: CustomAppUpdateInput,
    authUser?: AuthUser | null
  ): Promise<void> {
    validateCustomAppMetadata(updates);
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase
      .from("custom_apps")
      .update({
        name: updates.name,
        slug: updates.slug,
        bundle_id: updates.bundleId,
        hostname: updates.hostname,
        source: updates.source,
        icon: updates.icon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", profile.id);

    if (error) throw error;
  }

  async deleteCustomApp(id: string, authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase
      .from("custom_apps")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id);

    if (error) throw error;
  }

  async createCustomKeymap(
    keymap: Omit<CustomKeymap, "id" | "sections">,
    authUser?: AuthUser | null
  ): Promise<CustomKeymap> {
    validateCustomKeymapMetadata(keymap);
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { data, error } = await supabase
      .from("custom_keymaps")
      .insert({
        user_id: profile.id,
        custom_app_id: keymap.customAppId ?? null,
        base_app_slug: keymap.baseAppSlug ?? null,
        title: keymap.title,
        platforms: keymap.platforms ?? null,
        sort_order: keymap.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      customAppId: data.custom_app_id,
      baseAppSlug: data.base_app_slug,
      title: data.title,
      platforms: data.platforms,
      sections: [],
    };
  }

  async createCustomSection(
    section: Omit<CustomSection, "id" | "shortcuts">,
    authUser?: AuthUser | null
  ): Promise<CustomSection> {
    validateCustomSectionMetadata(section);
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    await requireCurrentProfile(authUser);

    const { data, error } = await supabase
      .from("custom_sections")
      .insert({
        keymap_id: section.keymapId,
        title: section.title,
        sort_order: section.sortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      keymapId: data.keymap_id,
      title: data.title,
      sortOrder: data.sort_order,
      shortcuts: [],
    };
  }

  async upsertShortcutOverlay(
    shortcut: Omit<CustomShortcut, "id"> & { id?: string },
    authUser?: AuthUser | null
  ): Promise<void> {
    const normalized = normalizeCustomShortcutDraft(shortcut);
    validateShortcutStorageMetadata(shortcut);
    if (normalized.key || normalized.comment) validateCustomShortcutDraft(normalized);
    if ((normalized.keyIsCleared && normalized.key) || (normalized.commentIsCleared && normalized.comment)) throw new Error("A cleared field cannot also contain a replacement.");
    if ((normalized.keyIsCleared || normalized.commentIsCleared) && process.env.NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING !== "true") throw new Error("Clearing fields is not enabled yet.");
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");
    const profile = await requireCurrentProfile(authUser);
    const values = {
      user_id: profile.id, section_id: null,
      base_app_slug: shortcut.baseAppSlug ?? null,
      base_keymap_title: shortcut.baseKeymapTitle ?? null,
      base_section_title: shortcut.baseSectionTitle ?? null,
      base_shortcut_title: shortcut.baseShortcutTitle ?? null,
      base_shortcut_id: shortcut.baseShortcutId ?? null,
      title: normalized.title, key: normalized.key ?? null, comment: normalized.comment ?? null,
      key_is_cleared: normalized.keyIsCleared ?? false, comment_is_cleared: normalized.commentIsCleared ?? false,
      is_deleted: normalized.isDeleted, sort_order: normalized.sortOrder,
    };
    const find = async () => {
      let query = supabase.from("custom_shortcuts").select("id")
        .eq("user_id", profile.id).eq("base_app_slug", shortcut.baseAppSlug!)
        .eq("base_keymap_title", shortcut.baseKeymapTitle!).eq("base_section_title", shortcut.baseSectionTitle!);
      query = shortcut.id ? query.eq("id", shortcut.id) : shortcut.baseShortcutId
        ? query.eq("base_shortcut_id", shortcut.baseShortcutId)
        : query.is("base_shortcut_id", null).eq("base_shortcut_title", shortcut.baseShortcutTitle!);
      const result = await query.maybeSingle();
      if (result.error) throw result.error;
      return result.data?.id as string | undefined;
    };
    const update = async (id: string) => {
      const { error } = await supabase.from("custom_shortcuts").update(values).eq("id", id).eq("user_id", profile.id);
      if (error) throw error;
    };
    const existing = await find();
    if (existing) return update(existing);
    if (shortcut.id) throw new Error("The edited shortcut no longer exists. Reload and try again.");
    const { error } = await supabase.from("custom_shortcuts").insert(values);
    if (!error) return;
    if (error.code === "23505" || error.code === "23514") {
      const raced = await find();
      if (raced) return update(raced);
    }
    throw error;
  }

  async createCustomShortcut(
    shortcut: Omit<CustomShortcut, "id">,
    authUser?: AuthUser | null
  ): Promise<CustomShortcut> {
    const normalizedShortcut = normalizeCustomShortcutDraft(shortcut);
    validateCustomShortcutDraft(normalizedShortcut);
    validateShortcutStorageMetadata(shortcut);

    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { data, error } = await supabase
      .from("custom_shortcuts")
      .insert({
        user_id: profile.id,
        section_id: shortcut.sectionId ?? null,
        base_app_slug: shortcut.baseAppSlug ?? null,
        base_keymap_title: shortcut.baseKeymapTitle ?? null,
        base_section_title: shortcut.baseSectionTitle ?? null,
        base_shortcut_title: shortcut.baseShortcutTitle ?? null,
        base_shortcut_id: shortcut.baseShortcutId ?? null,
        title: normalizedShortcut.title,
        key: normalizedShortcut.key ?? null,
        comment: normalizedShortcut.comment ?? null,
        is_deleted: normalizedShortcut.isDeleted,
        sort_order: normalizedShortcut.sortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      sectionId: data.section_id,
      baseAppSlug: data.base_app_slug,
      baseKeymapTitle: data.base_keymap_title,
      baseSectionTitle: data.base_section_title,
      baseShortcutTitle: data.base_shortcut_title,
      baseShortcutId: data.base_shortcut_id,
      title: data.title,
      key: data.key,
      comment: data.comment,
      isDeleted: data.is_deleted,
      sortOrder: data.sort_order,
    };
  }

  async createBaseAppShortcut(
    shortcut: BaseAppShortcutInput,
    authUser?: AuthUser | null
  ): Promise<CustomShortcut> {
    const normalizedShortcut = normalizeCustomShortcutDraft(shortcut);
    validateCustomShortcutDraft(normalizedShortcut);
    validateCustomKeymapMetadata({
      baseAppSlug: shortcut.baseAppSlug,
      title: shortcut.keymapTitle,
    });
    validateCustomSectionMetadata({
      title: shortcut.sectionTitle,
      sortOrder: 0,
    });

    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const keymap = await this.findOrCreateBaseKeymap({
      authUser,
      userId: profile.id,
      baseAppSlug: shortcut.baseAppSlug,
      title: shortcut.keymapTitle,
    });
    const section = await this.findOrCreateCustomSection({
      authUser,
      keymapId: keymap.id,
      title: shortcut.sectionTitle,
    });

    return this.createCustomShortcut(
      {
        sectionId: section.id,
        title: normalizedShortcut.title,
        key: normalizedShortcut.key,
        comment: normalizedShortcut.comment,
        isDeleted: false,
        sortOrder: section.shortcuts.length,
      },
      authUser
    );
  }

  async updateCustomShortcut(
    id: string,
    shortcut: CustomShortcutUpdateInput,
    authUser?: AuthUser | null
  ): Promise<void> {
    const normalizedShortcut = normalizeCustomShortcutDraft(shortcut);
    validateCustomShortcutDraft(normalizedShortcut);

    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase
      .from("custom_shortcuts")
      .update({
        title: normalizedShortcut.title,
        key: normalizedShortcut.key ?? null,
        comment: normalizedShortcut.comment ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", profile.id);

    if (error) throw error;
  }

  async deleteCustomShortcut(
    id: string,
    authUser?: AuthUser | null
  ): Promise<void> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const profile = await requireCurrentProfile(authUser);

    const { error } = await supabase
      .from("custom_shortcuts")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id);

    if (error) throw error;
  }

  async updateCustomKeymap(id: string, updates: Pick<CustomKeymap, "title" | "platforms">, authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");
    const profile = await requireCurrentProfile(authUser);
    validateCustomKeymapMetadata(updates);
    const { error } = await supabase.from("custom_keymaps").update({ title: updates.title, platforms: updates.platforms ?? null }).eq("id", id).eq("user_id", profile.id);
    if (error) throw error;
  }

  async deleteCustomKeymap(id: string, authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");
    const profile = await requireCurrentProfile(authUser);
    const { error } = await supabase.from("custom_keymaps").delete().eq("id", id).eq("user_id", profile.id);
    if (error) throw error;
  }

  async updateCustomSection(id: string, updates: Pick<CustomSection, "title" | "sortOrder">, authUser?: AuthUser | null): Promise<void> {
    validateCustomSectionMetadata(updates);
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");
    await requireCurrentProfile(authUser);
    const { error } = await supabase.from("custom_sections").update({ title: updates.title, sort_order: updates.sortOrder }).eq("id", id);
    if (error) throw error;
  }

  async deleteCustomSection(id: string, authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");
    await requireCurrentProfile(authUser);
    const { error } = await supabase.from("custom_sections").delete().eq("id", id);
    if (error) throw error;
  }

  async reorderCustomItems(kind: "keymaps" | "sections" | "shortcuts", ids: string[], authUser?: AuthUser | null): Promise<void> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");
    await requireCurrentProfile(authUser);
    const { error } = await supabase.rpc("reorder_custom_items", { kind, ids });
    if (error) throw error;
  }

  private async findOrCreateBaseKeymap({
    authUser,
    userId,
    baseAppSlug,
    title,
  }: {
    authUser?: AuthUser | null;
    userId: string;
    baseAppSlug: string;
    title: string;
  }): Promise<CustomKeymap> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const existing = await supabase
      .from("custom_keymaps")
      .select(
        `
        *,
        custom_sections (
          *,
          custom_shortcuts (*)
        )
      `
      )
      .eq("user_id", userId)
      .eq("base_app_slug", baseAppSlug)
      .eq("title", title)
      .limit(1);

    if (existing.error) throw existing.error;
    if (existing.data?.[0]) {
      return this.mapCustomKeymaps([
        existing.data[0] as Record<string, unknown>,
      ])[0];
    }

    const created = await supabase
      .from("custom_keymaps")
      .insert({
        user_id: userId,
        custom_app_id: null,
        base_app_slug: baseAppSlug,
        title,
        platforms: null,
      })
      .select()
      .single();

    if (created.error) throw created.error;

    return {
      id: created.data.id,
      baseAppSlug: created.data.base_app_slug,
      title: created.data.title,
      platforms: created.data.platforms,
      sections: [],
    };
  }

  private async findOrCreateCustomSection({
    authUser,
    keymapId,
    title,
  }: {
    authUser?: AuthUser | null;
    keymapId: string;
    title: string;
  }): Promise<CustomSection> {
    const supabase = createClientOrNull(authUser);
    if (!supabase) throw new Error("Supabase sign in is not configured.");

    const existing = await supabase
      .from("custom_sections")
      .select("*, custom_shortcuts (*)")
      .eq("keymap_id", keymapId)
      .eq("title", title)
      .limit(1);

    if (existing.error) throw existing.error;
    if (existing.data?.[0]) {
      return this.mapCustomSections([
        existing.data[0] as Record<string, unknown>,
      ])[0];
    }

    const siblingSections = await supabase
      .from("custom_sections")
      .select("id")
      .eq("keymap_id", keymapId);

    if (siblingSections.error) throw siblingSections.error;

    const created = await supabase
      .from("custom_sections")
      .insert({
        keymap_id: keymapId,
        title,
        sort_order: siblingSections.data?.length ?? 0,
      })
      .select()
      .single();

    if (created.error) throw created.error;

    return {
      id: created.data.id,
      keymapId: created.data.keymap_id,
      title: created.data.title,
      sortOrder: created.data.sort_order,
      shortcuts: [],
    };
  }

  private mapCustomApps(data: unknown[]): CustomApp[] {
    return (data as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      slug: row.slug as string,
      name: row.name as string,
      bundleId: (row.bundle_id as string | null) ?? undefined,
      hostname: (row.hostname as string | null) ?? undefined,
      source: (row.source as string | null) ?? undefined,
      icon: (row.icon as string | null) ?? undefined,
      keymaps: this.mapCustomKeymaps(
        (row.custom_keymaps as Record<string, unknown>[]) ?? []
      ),
    }));
  }

  private mapCustomKeymaps(data: Record<string, unknown>[]): CustomKeymap[] {
    return data.map((row) => ({
      id: row.id as string,
      customAppId: (row.custom_app_id as string | null) ?? undefined,
      baseAppSlug: (row.base_app_slug as string | null) ?? undefined,
      title: row.title as string,
      platforms: (row.platforms as CustomKeymap["platforms"] | null) ?? undefined,
      sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
      sections: this.mapCustomSections(
        (row.custom_sections as Record<string, unknown>[]) ?? []
      ),
    }));
  }

  private mapCustomSections(data: Record<string, unknown>[]): CustomSection[] {
    return data.map((row) => ({
      id: row.id as string,
      keymapId: row.keymap_id as string,
      title: row.title as string,
      sortOrder: row.sort_order as number,
      shortcuts: this.mapCustomShortcuts(
        (row.custom_shortcuts as Record<string, unknown>[]) ?? []
      ),
    }));
  }

  private mapCustomShortcuts(data: Record<string, unknown>[]): CustomShortcut[] {
    return data.map((row) => ({
      id: row.id as string,
      sectionId: (row.section_id as string | null) ?? undefined,
      baseAppSlug: (row.base_app_slug as string | null) ?? undefined,
      baseKeymapTitle: (row.base_keymap_title as string | null) ?? undefined,
      baseSectionTitle: (row.base_section_title as string | null) ?? undefined,
      baseShortcutTitle: (row.base_shortcut_title as string | null) ?? undefined,
      baseShortcutId: (row.base_shortcut_id as string | null) ?? undefined,
      title: row.title as string,
      key: (row.key as string | null) ?? undefined,
      comment: (row.comment as string | null) ?? undefined,
      isDeleted: row.is_deleted as boolean,
      keyIsCleared: row.key_is_cleared === true,
      commentIsCleared: row.comment_is_cleared === true,
      sortOrder: row.sort_order as number,
    }));
  }

  private mapShortcutOverlays(data: Record<string, unknown>[]): ShortcutOverlay[] {
    return data.map((row) => ({
      baseKey: `${row.base_app_slug}:${row.base_keymap_title}:${row.base_section_title}:${row.base_shortcut_title}`,
      baseShortcutId: (row.base_shortcut_id as string | null) ?? undefined,
      modification: {
        id: row.id as string,
        title: row.title as string,
        key: row.key as string | undefined,
        comment: row.comment as string | undefined,
        isDeleted: row.is_deleted as boolean,
      keyIsCleared: row.key_is_cleared === true,
      commentIsCleared: row.comment_is_cleared === true,
      },
    }));
  }
}

export const customizationsService = new CustomizationsService();
