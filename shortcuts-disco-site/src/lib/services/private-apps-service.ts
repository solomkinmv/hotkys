import type { AuthUser } from "@/lib/auth/types";
import { createClientOrNull } from "@/lib/supabase/client";
import { requireCurrentProfile } from "./current-profile";
import {
  normalizeCustomShortcutDraft,
  validateCustomShortcutDraft,
} from "./custom-shortcut-validation";
import {
  validateRequiredText,
  USER_CONTENT_LIMITS,
} from "@/lib/validation/user-content";

type Entity = "keymap" | "section" | "shortcut";
interface ShortcutUpdate {
  title: string;
  key?: string;
  comment?: string;
  sectionId?: string;
}

async function mutate(
  appId: string,
  entity: Entity,
  id: string,
  operation: "update" | "delete",
  values: Record<string, unknown>,
  user?: AuthUser | null,
): Promise<void> {
  const client = createClientOrNull();
  if (!client) throw new Error("Supabase sign in is not configured.");
  await requireCurrentProfile(user);
  const { error } = await client.rpc("private_app_mutate", {
    p_app_id: appId,
    p_entity: entity,
    p_id: id,
    p_operation: operation,
    p_values: values,
  });
  if (error) throw error;
}

export const privateAppsService = {
  async updateKeymap(
    appId: string,
    id: string,
    values: { title: string },
    user?: AuthUser | null,
  ) {
    const title = values.title.trim();
    validateRequiredText(
      title,
      "Keymap title",
      USER_CONTENT_LIMITS.keymapTitle,
    );
    await mutate(appId, "keymap", id, "update", { title }, user);
  },
  async updateSection(
    appId: string,
    id: string,
    values: { title: string },
    user?: AuthUser | null,
  ) {
    const title = values.title.trim();
    validateRequiredText(
      title,
      "Section title",
      USER_CONTENT_LIMITS.sectionTitle,
    );
    await mutate(appId, "section", id, "update", { title }, user);
  },
  async updateShortcut(
    appId: string,
    id: string,
    values: ShortcutUpdate,
    user?: AuthUser | null,
  ) {
    const draft = normalizeCustomShortcutDraft({
      title: values.title.trim(),
      key: values.key?.trim() || undefined,
      comment: values.comment?.trim() || undefined,
    });
    validateCustomShortcutDraft(draft);
    await mutate(
      appId,
      "shortcut",
      id,
      "update",
      {
        title: draft.title,
        key: draft.key ?? null,
        comment: draft.comment ?? null,
        ...(values.sectionId ? { section_id: values.sectionId } : {}),
      },
      user,
    );
  },
  deleteKeymap(appId: string, id: string, user?: AuthUser | null) {
    return mutate(appId, "keymap", id, "delete", {}, user);
  },
  deleteSection(appId: string, id: string, user?: AuthUser | null) {
    return mutate(appId, "section", id, "delete", {}, user);
  },
  deleteShortcut(appId: string, id: string, user?: AuthUser | null) {
    return mutate(appId, "shortcut", id, "delete", {}, user);
  },
  async reorder(
    appId: string,
    entity: Entity,
    parentId: string,
    orderedIds: string[],
    user?: AuthUser | null,
  ) {
    const client = createClientOrNull();
    if (!client) throw new Error("Supabase sign in is not configured.");
    await requireCurrentProfile(user);
    const { error } = await client.rpc("private_app_reorder", {
      p_app_id: appId,
      p_entity: entity,
      p_parent_id: parentId,
      p_ordered_ids: orderedIds,
    });
    if (error) throw error;
  },
};
