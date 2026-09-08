-- Stable private references survive metadata changes. Legacy rows remain readable.
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS custom_keymap_id UUID REFERENCES public.custom_keymaps(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS custom_shortcut_id UUID REFERENCES public.custom_shortcuts(id) ON DELETE CASCADE;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_custom_reference_kind;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_custom_reference_kind CHECK (
  (custom_keymap_id IS NULL OR item_type IN ('keymap', 'shortcut')) AND
  (custom_shortcut_id IS NULL OR item_type = 'shortcut')
);
-- Backfill only positively identified private apps with one-to-one matches; duplicate labels and orphan rows are retained.
WITH candidates AS (
  SELECT f.id, min(k.id::text)::uuid AS target
  FROM public.favorites f JOIN public.custom_keymaps k ON k.user_id = f.user_id AND k.title = f.keymap_title
  LEFT JOIN public.custom_apps a ON a.id = k.custom_app_id
  WHERE f.item_type = 'keymap' AND f.custom_keymap_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.favorites existing WHERE existing.user_id = f.user_id AND existing.custom_keymap_id = k.id) AND
    ((f.custom_app_id IS NOT NULL AND f.custom_app_id = k.custom_app_id) OR
     (f.custom_app_id IS NULL AND f.app_slug = 'custom-' || a.slug))
  GROUP BY f.id HAVING count(*) = 1
), unique_targets AS (SELECT target FROM candidates GROUP BY target HAVING count(*) = 1)
UPDATE public.favorites f SET custom_keymap_id = c.target FROM candidates c JOIN unique_targets u ON u.target = c.target WHERE f.id = c.id;
WITH candidates AS (
  SELECT f.id, min(s.id::text)::uuid AS target
  FROM public.favorites f JOIN public.custom_shortcuts s ON s.user_id = f.user_id AND s.title = f.shortcut_title
  JOIN public.custom_sections section ON section.id = s.section_id AND section.title = f.section_title
  JOIN public.custom_keymaps k ON k.id = section.keymap_id AND k.title = f.keymap_title
  LEFT JOIN public.custom_apps a ON a.id = k.custom_app_id
  WHERE f.item_type = 'shortcut' AND f.custom_shortcut_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.favorites existing WHERE existing.user_id = f.user_id AND existing.custom_shortcut_id = s.id) AND f.base_shortcut_id IS NULL AND
    ((f.custom_app_id IS NOT NULL AND f.custom_app_id = k.custom_app_id) OR
     (f.custom_app_id IS NULL AND f.app_slug = 'custom-' || a.slug))
  GROUP BY f.id HAVING count(*) = 1
), unique_targets AS (SELECT target FROM candidates GROUP BY target HAVING count(*) = 1)
UPDATE public.favorites f SET custom_shortcut_id = c.target FROM candidates c JOIN unique_targets u ON u.target = c.target WHERE f.id = c.id;
DROP INDEX IF EXISTS public.favorites_identity_unique;
CREATE UNIQUE INDEX favorites_identity_unique ON public.favorites (
  user_id, item_type, COALESCE(app_slug, ''), COALESCE(keymap_title, ''), COALESCE(shortcut_title, ''),
  COALESCE(section_title, ''), COALESCE(base_shortcut_id, ''), COALESCE(custom_app_id::text, '')
) WHERE custom_keymap_id IS NULL AND custom_shortcut_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_custom_keymap_unique ON public.favorites(user_id, custom_keymap_id) WHERE item_type = 'keymap' AND custom_keymap_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_custom_shortcut_unique ON public.favorites(user_id, custom_shortcut_id) WHERE custom_shortcut_id IS NOT NULL;
DROP POLICY IF EXISTS "Favorite references belong to their owner" ON public.favorites;
CREATE POLICY "Favorite references belong to their owner" ON public.favorites AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (
  (custom_keymap_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_keymaps k WHERE k.id = favorites.custom_keymap_id AND k.user_id = favorites.user_id AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id))) AND
  (custom_shortcut_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_shortcuts s JOIN public.custom_sections section ON section.id = s.section_id JOIN public.custom_keymaps k ON k.id = section.keymap_id WHERE s.id = favorites.custom_shortcut_id AND s.user_id = favorites.user_id AND k.user_id = favorites.user_id AND (favorites.custom_keymap_id IS NULL OR k.id = favorites.custom_keymap_id) AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id)))
)
WITH CHECK (
  (custom_keymap_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_keymaps k WHERE k.id = favorites.custom_keymap_id AND k.user_id = favorites.user_id AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id))) AND
  (custom_shortcut_id IS NULL OR EXISTS (SELECT 1 FROM public.custom_shortcuts s JOIN public.custom_sections section ON section.id = s.section_id JOIN public.custom_keymaps k ON k.id = section.keymap_id WHERE s.id = favorites.custom_shortcut_id AND s.user_id = favorites.user_id AND k.user_id = favorites.user_id AND (favorites.custom_keymap_id IS NULL OR k.id = favorites.custom_keymap_id) AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id)))
);
