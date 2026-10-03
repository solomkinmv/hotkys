BEGIN;

ALTER TABLE public.custom_keymaps ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS custom_keymap_id UUID REFERENCES public.custom_keymaps(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS custom_shortcut_id UUID REFERENCES public.custom_shortcuts(id) ON DELETE CASCADE;

-- Remove snapshot-based indexes before upgrading legacy rows; reruns can also
-- encounter favorites written by older clients after the first migration.
DROP INDEX IF EXISTS public.favorites_identity_unique;
DROP INDEX IF EXISTS public.favorites_private_app_unique;
DROP INDEX IF EXISTS public.favorites_private_keymap_unique;
DROP INDEX IF EXISTS public.favorites_private_shortcut_unique;
DROP INDEX IF EXISTS public.favorites_custom_keymap_unique;
DROP INDEX IF EXISTS public.favorites_custom_shortcut_unique;

-- New private identities refer only to the target. Labels are display snapshots.
-- Existing title-based favorites remain readable when no unambiguous target exists.
UPDATE public.favorites f SET custom_app_id = a.id
FROM public.custom_apps a
WHERE f.item_type = 'app' AND f.custom_app_id IS NULL
  AND f.custom_keymap_id IS NULL AND f.custom_shortcut_id IS NULL
  AND a.user_id = f.user_id AND f.app_slug = 'custom-' || a.slug;
WITH matches AS (
  SELECT f.id, min(k.id::text)::uuid AS target
  FROM public.favorites f
  JOIN public.custom_apps a ON a.user_id = f.user_id
    AND (a.id = f.custom_app_id OR (f.custom_app_id IS NULL AND f.app_slug = 'custom-' || a.slug))
  JOIN public.custom_keymaps k ON k.custom_app_id = a.id AND k.user_id = f.user_id AND k.title = f.keymap_title
  WHERE f.item_type = 'keymap' AND f.custom_keymap_id IS NULL AND f.custom_shortcut_id IS NULL AND f.base_shortcut_id IS NULL
  GROUP BY f.id HAVING count(*) = 1
)
UPDATE public.favorites f SET custom_keymap_id = matches.target, custom_app_id = NULL
FROM matches WHERE f.id = matches.id;
WITH matches AS (
  SELECT f.id, min(s.id::text)::uuid AS target
  FROM public.favorites f
  JOIN public.custom_apps a ON a.user_id = f.user_id
    AND (a.id = f.custom_app_id OR (f.custom_app_id IS NULL AND f.app_slug = 'custom-' || a.slug))
  JOIN public.custom_keymaps k ON k.custom_app_id = a.id AND k.user_id = f.user_id AND k.title = f.keymap_title
  JOIN public.custom_sections sec ON sec.keymap_id = k.id AND sec.title = f.section_title
  JOIN public.custom_shortcuts s ON s.section_id = sec.id AND s.user_id = f.user_id AND s.title = f.shortcut_title AND s.base_app_slug IS NULL
  WHERE f.item_type = 'shortcut' AND f.custom_keymap_id IS NULL AND f.custom_shortcut_id IS NULL
    AND f.base_shortcut_id IS NULL
  GROUP BY f.id HAVING count(*) = 1
)
UPDATE public.favorites f SET custom_shortcut_id = matches.target, custom_app_id = NULL
FROM matches WHERE f.id = matches.id;

-- Old slugs/titles can have produced duplicate favorites for the same object.
-- Retain the oldest saved row for each now-stable private identity.
DELETE FROM public.favorites newer USING public.favorites older
WHERE newer.user_id = older.user_id AND newer.item_type = older.item_type
  AND (newer.created_at, newer.id) > (older.created_at, older.id)
  AND (
    (newer.item_type = 'app' AND newer.custom_app_id = older.custom_app_id)
    OR (newer.item_type = 'keymap' AND newer.custom_keymap_id = older.custom_keymap_id)
    OR (newer.custom_shortcut_id = older.custom_shortcut_id)
  );
-- Keep the existing public-custom-target contract, including optional ancestor
-- snapshots. Private-only scope belongs in the editing RPCs, not favorites RLS.
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_private_target;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_custom_reference_kind;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_custom_reference_kind CHECK (
  (custom_keymap_id IS NULL OR item_type IN ('keymap', 'shortcut'))
  AND (custom_shortcut_id IS NULL OR item_type = 'shortcut')
);
DROP INDEX IF EXISTS public.favorites_identity_unique;
CREATE UNIQUE INDEX favorites_identity_unique ON public.favorites (
  user_id, item_type, COALESCE(app_slug, ''), COALESCE(keymap_title, ''),
  COALESCE(shortcut_title, ''), COALESCE(section_title, ''), COALESCE(base_shortcut_id, ''), COALESCE(custom_app_id::text, '')
) WHERE custom_keymap_id IS NULL AND custom_shortcut_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_private_app_unique ON public.favorites(user_id, custom_app_id)
  WHERE item_type = 'app' AND custom_app_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_custom_keymap_unique ON public.favorites(user_id, custom_keymap_id)
  WHERE item_type = 'keymap' AND custom_keymap_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_custom_shortcut_unique ON public.favorites(user_id, custom_shortcut_id)
  WHERE custom_shortcut_id IS NOT NULL;

-- Preserve the hosted generic ownership policy for public and private targets.
DROP POLICY IF EXISTS "Private favorite targets belong to their owner" ON public.favorites;
DROP POLICY IF EXISTS "Favorite references belong to their owner" ON public.favorites;
CREATE POLICY "Favorite references belong to their owner" ON public.favorites
AS RESTRICTIVE FOR ALL TO authenticated, anon
USING (
  (custom_keymap_id IS NULL OR EXISTS (
    SELECT 1 FROM public.custom_keymaps k
    WHERE k.id = favorites.custom_keymap_id AND k.user_id = favorites.user_id
      AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id)
  )) AND (custom_shortcut_id IS NULL OR EXISTS (
    SELECT 1 FROM public.custom_shortcuts s
    JOIN public.custom_sections sec ON sec.id = s.section_id
    JOIN public.custom_keymaps k ON k.id = sec.keymap_id
    WHERE s.id = favorites.custom_shortcut_id AND s.user_id = favorites.user_id AND k.user_id = favorites.user_id
      AND (favorites.custom_keymap_id IS NULL OR k.id = favorites.custom_keymap_id)
      AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id)
  ))
)
WITH CHECK (
  (custom_keymap_id IS NULL OR EXISTS (
    SELECT 1 FROM public.custom_keymaps k
    WHERE k.id = favorites.custom_keymap_id AND k.user_id = favorites.user_id
      AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id)
  )) AND (custom_shortcut_id IS NULL OR EXISTS (
    SELECT 1 FROM public.custom_shortcuts s
    JOIN public.custom_sections sec ON sec.id = s.section_id
    JOIN public.custom_keymaps k ON k.id = sec.keymap_id
    WHERE s.id = favorites.custom_shortcut_id AND s.user_id = favorites.user_id AND k.user_id = favorites.user_id
      AND (favorites.custom_keymap_id IS NULL OR k.id = favorites.custom_keymap_id)
      AND (favorites.custom_app_id IS NULL OR k.custom_app_id = favorites.custom_app_id)
  ))
);

CREATE OR REPLACE FUNCTION public.private_app_reorder(
  p_app_id UUID, p_entity TEXT, p_parent_id UUID, p_ordered_ids UUID[]
) RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE actual UUID[]; owner UUID;
BEGIN
  -- Serialize private edits within one app, then validate the full current set.
  SELECT a.user_id INTO owner FROM public.custom_apps a JOIN public.profiles p ON p.id = a.user_id
    WHERE a.id = p_app_id AND p.clerk_user_id = (SELECT auth.jwt()->>'sub') FOR UPDATE OF a;
  IF owner IS NULL THEN RAISE EXCEPTION 'Private app not found' USING ERRCODE = '42501'; END IF;
  IF p_entity = 'section' THEN
    PERFORM 1 FROM public.custom_keymaps WHERE id = p_parent_id FOR UPDATE;
  ELSIF p_entity = 'shortcut' THEN
    PERFORM 1 FROM public.custom_sections WHERE id = p_parent_id FOR UPDATE;
  END IF;
  IF p_entity = 'keymap' AND p_parent_id = p_app_id THEN
    SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO actual FROM public.custom_keymaps
      WHERE custom_app_id = p_app_id AND user_id = owner AND base_app_slug IS NULL;
  ELSIF p_entity = 'section' AND EXISTS (
    SELECT 1 FROM public.custom_keymaps WHERE id = p_parent_id AND custom_app_id = p_app_id AND user_id = owner AND base_app_slug IS NULL
  ) THEN
    SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO actual FROM public.custom_sections WHERE keymap_id = p_parent_id;
  ELSIF p_entity = 'shortcut' AND EXISTS (
    SELECT 1 FROM public.custom_sections sec JOIN public.custom_keymaps k ON k.id = sec.keymap_id
    WHERE sec.id = p_parent_id AND k.custom_app_id = p_app_id AND k.user_id = owner AND k.base_app_slug IS NULL
  ) THEN
    SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO actual FROM public.custom_shortcuts
      WHERE section_id = p_parent_id AND user_id = owner AND base_app_slug IS NULL;
  ELSE RAISE EXCEPTION 'Invalid private parent' USING ERRCODE = '42501'; END IF;
  IF p_ordered_ids IS NULL OR cardinality(p_ordered_ids) <> cardinality(actual)
    OR cardinality(p_ordered_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_ordered_ids) x)
    OR NOT (p_ordered_ids @> actual AND actual @> p_ordered_ids)
  THEN RAISE EXCEPTION 'Order must contain every current sibling exactly once' USING ERRCODE = '22023'; END IF;
  IF p_entity = 'keymap' THEN
    UPDATE public.custom_keymaps t SET sort_order = ord.n - 1
      FROM unnest(p_ordered_ids) WITH ORDINALITY ord(id,n) WHERE t.id = ord.id;
  ELSIF p_entity = 'section' THEN
    UPDATE public.custom_sections t SET sort_order = ord.n - 1
      FROM unnest(p_ordered_ids) WITH ORDINALITY ord(id,n) WHERE t.id = ord.id;
  ELSE
    UPDATE public.custom_shortcuts t SET sort_order = ord.n - 1
      FROM unnest(p_ordered_ids) WITH ORDINALITY ord(id,n) WHERE t.id = ord.id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.private_app_mutate(
  p_app_id UUID, p_entity TEXT, p_id UUID, p_operation TEXT, p_values JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE owner UUID; parent UUID; destination UUID; sibling_ids UUID[]; new_title TEXT;
BEGIN
  SELECT a.user_id INTO owner FROM public.custom_apps a JOIN public.profiles p ON p.id = a.user_id
    WHERE a.id = p_app_id AND p.clerk_user_id = (SELECT auth.jwt()->>'sub') FOR UPDATE OF a;
  IF owner IS NULL THEN RAISE EXCEPTION 'Private app not found' USING ERRCODE = '42501'; END IF;
  IF p_operation NOT IN ('update', 'delete') OR p_operation IS NULL THEN
    RAISE EXCEPTION 'Invalid private operation' USING ERRCODE = '22023';
  END IF;
  IF p_entity = 'keymap' THEN
    SELECT custom_app_id INTO parent FROM public.custom_keymaps
      WHERE id = p_id AND custom_app_id = p_app_id AND user_id = owner AND base_app_slug IS NULL;
  ELSIF p_entity = 'section' THEN
    SELECT sec.keymap_id INTO parent FROM public.custom_sections sec JOIN public.custom_keymaps k ON k.id = sec.keymap_id
      WHERE sec.id = p_id AND k.custom_app_id = p_app_id AND k.user_id = owner AND k.base_app_slug IS NULL;
  ELSIF p_entity = 'shortcut' THEN
    SELECT s.section_id INTO parent FROM public.custom_shortcuts s
      JOIN public.custom_sections sec ON sec.id = s.section_id JOIN public.custom_keymaps k ON k.id = sec.keymap_id
      WHERE s.id = p_id AND s.user_id = owner AND s.base_app_slug IS NULL
        AND k.custom_app_id = p_app_id AND k.user_id = owner AND k.base_app_slug IS NULL;
  END IF;
  IF parent IS NULL THEN RAISE EXCEPTION 'Private item not found' USING ERRCODE = '42501'; END IF;
  IF p_entity = 'section' THEN
    PERFORM 1 FROM public.custom_keymaps WHERE id = parent FOR UPDATE;
  ELSIF p_entity = 'shortcut' THEN
    PERFORM 1 FROM public.custom_sections WHERE id = parent FOR UPDATE;
  END IF;
  IF p_operation = 'delete' THEN
    IF p_entity = 'keymap' THEN DELETE FROM public.custom_keymaps WHERE id = p_id;
    ELSIF p_entity = 'section' THEN DELETE FROM public.custom_sections WHERE id = p_id;
    ELSE DELETE FROM public.custom_shortcuts WHERE id = p_id; END IF;
  ELSE
    new_title := btrim(p_values->>'title');
    IF new_title IS NULL OR new_title = '' THEN RAISE EXCEPTION 'Title is required' USING ERRCODE = '22023'; END IF;
    IF p_entity = 'keymap' THEN UPDATE public.custom_keymaps SET title = new_title WHERE id = p_id;
    ELSIF p_entity = 'section' THEN UPDATE public.custom_sections SET title = new_title WHERE id = p_id;
    ELSE
      destination := COALESCE((p_values->>'section_id')::uuid, parent);
      IF NOT EXISTS (
        SELECT 1 FROM public.custom_sections sec JOIN public.custom_keymaps k ON k.id = sec.keymap_id
        WHERE sec.id = destination AND k.custom_app_id = p_app_id AND k.user_id = owner AND k.base_app_slug IS NULL
      ) THEN RAISE EXCEPTION 'Invalid private destination' USING ERRCODE = '42501'; END IF;
      IF NULLIF(btrim(p_values->>'key'), '') IS NULL AND NULLIF(btrim(p_values->>'comment'), '') IS NULL THEN
        RAISE EXCEPTION 'Keys or instructions are required' USING ERRCODE = '22023';
      END IF;
      PERFORM 1 FROM public.custom_sections WHERE id = destination FOR UPDATE;
      IF destination <> parent THEN
        SELECT COALESCE(array_agg(id ORDER BY sort_order, id), ARRAY[]::uuid[]) INTO sibling_ids
          FROM public.custom_shortcuts WHERE section_id = destination AND user_id = owner AND base_app_slug IS NULL;
        PERFORM public.private_app_reorder(p_app_id, 'shortcut', destination, sibling_ids);
      END IF;
      -- Older clients include ancestor snapshots. Clear them while the old
      -- lineage is still readable, so a move cannot hide/cascade the favorite.
      IF destination <> parent THEN
        UPDATE public.favorites SET custom_app_id = NULL, custom_keymap_id = NULL
          WHERE custom_shortcut_id = p_id AND user_id = owner;
      END IF;
      UPDATE public.custom_shortcuts SET title = new_title,
        key = NULLIF(btrim(p_values->>'key'), ''), comment = NULLIF(btrim(p_values->>'comment'), ''),
        section_id = destination,
        sort_order = CASE WHEN destination <> parent THEN cardinality(sibling_ids) ELSE sort_order END
        WHERE id = p_id;
    END IF;
  END IF;
  -- Compact the source after removal/move, including previously equal orders.
  IF p_entity = 'keymap' THEN
    SELECT COALESCE(array_agg(id ORDER BY sort_order, id), ARRAY[]::uuid[]) INTO sibling_ids
      FROM public.custom_keymaps WHERE custom_app_id = parent AND user_id = owner AND base_app_slug IS NULL;
  ELSIF p_entity = 'section' THEN
    SELECT COALESCE(array_agg(id ORDER BY sort_order, id), ARRAY[]::uuid[]) INTO sibling_ids
      FROM public.custom_sections WHERE keymap_id = parent;
  ELSE
    SELECT COALESCE(array_agg(id ORDER BY sort_order, id), ARRAY[]::uuid[]) INTO sibling_ids
      FROM public.custom_shortcuts WHERE section_id = parent AND user_id = owner AND base_app_slug IS NULL;
  END IF;
  PERFORM public.private_app_reorder(p_app_id, p_entity, parent, sibling_ids);
END $$;

REVOKE ALL ON FUNCTION public.private_app_mutate(UUID, TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.private_app_reorder(UUID, TEXT, UUID, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.private_app_mutate(UUID, TEXT, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.private_app_reorder(UUID, TEXT, UUID, UUID[]) TO authenticated;

COMMIT;
