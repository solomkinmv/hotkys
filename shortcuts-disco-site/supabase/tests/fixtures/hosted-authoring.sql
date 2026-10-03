-- Metadata-only compatibility fixture: hosted migrations through 20260907233528.
-- Synthetic tests supply their own data; this contains no production content.
ALTER TABLE public.custom_keymaps ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.custom_shortcuts ADD COLUMN key_is_cleared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.custom_shortcuts ADD COLUMN comment_is_cleared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.custom_shortcuts ADD CONSTRAINT custom_shortcuts_clear_fields CHECK (
  (NOT key_is_cleared OR key IS NULL) AND (NOT comment_is_cleared OR comment IS NULL)
  AND (NOT (key_is_cleared OR comment_is_cleared) OR base_app_slug IS NOT NULL)
);
CREATE UNIQUE INDEX custom_keymaps_base_title_unique ON public.custom_keymaps(user_id,base_app_slug,title) WHERE base_app_slug IS NOT NULL;
CREATE UNIQUE INDEX custom_keymaps_custom_title_unique ON public.custom_keymaps(user_id,custom_app_id,title) WHERE custom_app_id IS NOT NULL;
CREATE UNIQUE INDEX custom_sections_title_unique ON public.custom_sections(keymap_id,title);
ALTER TABLE public.favorites ADD COLUMN custom_keymap_id UUID REFERENCES public.custom_keymaps(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN custom_shortcut_id UUID REFERENCES public.custom_shortcuts(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_custom_reference_kind CHECK (
  (custom_keymap_id IS NULL OR item_type IN ('keymap','shortcut')) AND
  (custom_shortcut_id IS NULL OR item_type='shortcut')
);
DROP INDEX public.favorites_identity_unique;
CREATE UNIQUE INDEX favorites_identity_unique ON public.favorites(
  user_id,item_type,COALESCE(app_slug,''),COALESCE(keymap_title,''),COALESCE(shortcut_title,''),
  COALESCE(section_title,''),COALESCE(base_shortcut_id,''),COALESCE(custom_app_id::text,'')
) WHERE custom_keymap_id IS NULL AND custom_shortcut_id IS NULL;
CREATE UNIQUE INDEX favorites_custom_keymap_unique ON public.favorites(user_id,custom_keymap_id) WHERE item_type='keymap' AND custom_keymap_id IS NOT NULL;
CREATE UNIQUE INDEX favorites_custom_shortcut_unique ON public.favorites(user_id,custom_shortcut_id) WHERE custom_shortcut_id IS NOT NULL;
CREATE POLICY "Favorite references belong to their owner" ON public.favorites AS RESTRICTIVE FOR ALL TO anon,authenticated
USING (
 (custom_keymap_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_keymaps k WHERE k.id=favorites.custom_keymap_id AND k.user_id=favorites.user_id AND (favorites.custom_app_id IS NULL OR k.custom_app_id=favorites.custom_app_id)))
 AND (custom_shortcut_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_shortcuts s JOIN public.custom_sections sec ON sec.id=s.section_id JOIN public.custom_keymaps k ON k.id=sec.keymap_id WHERE s.id=favorites.custom_shortcut_id AND s.user_id=favorites.user_id AND k.user_id=favorites.user_id AND (favorites.custom_keymap_id IS NULL OR k.id=favorites.custom_keymap_id) AND (favorites.custom_app_id IS NULL OR k.custom_app_id=favorites.custom_app_id)))
)
WITH CHECK (
 (custom_keymap_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_keymaps k WHERE k.id=favorites.custom_keymap_id AND k.user_id=favorites.user_id AND (favorites.custom_app_id IS NULL OR k.custom_app_id=favorites.custom_app_id)))
 AND (custom_shortcut_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_shortcuts s JOIN public.custom_sections sec ON sec.id=s.section_id JOIN public.custom_keymaps k ON k.id=sec.keymap_id WHERE s.id=favorites.custom_shortcut_id AND s.user_id=favorites.user_id AND k.user_id=favorites.user_id AND (favorites.custom_keymap_id IS NULL OR k.id=favorites.custom_keymap_id) AND (favorites.custom_app_id IS NULL OR k.custom_app_id=favorites.custom_app_id)))
);
