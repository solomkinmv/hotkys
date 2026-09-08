-- Refuse to guess how to merge colliding user drafts. Resolve reported parents first.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.custom_keymaps GROUP BY user_id, custom_app_id, base_app_slug, title HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate keymap titles exist. Resolve duplicates within each app before this migration.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.custom_sections GROUP BY keymap_id, title HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate section titles exist. Resolve duplicates within each keymap before this migration.';
  END IF;
END $$;
ALTER TABLE public.custom_keymaps ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS custom_keymaps_custom_title_unique ON public.custom_keymaps(user_id, custom_app_id, title) WHERE custom_app_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS custom_keymaps_base_title_unique ON public.custom_keymaps(user_id, base_app_slug, title) WHERE base_app_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS custom_sections_title_unique ON public.custom_sections(keymap_id, title);
ALTER TABLE public.custom_keymaps DROP CONSTRAINT IF EXISTS custom_keymaps_unique_platforms;
ALTER TABLE public.custom_keymaps ADD CONSTRAINT custom_keymaps_unique_platforms CHECK (
  platforms IS NULL OR (cardinality(array_positions(platforms, 'macos')) <= 1 AND cardinality(array_positions(platforms, 'windows')) <= 1 AND cardinality(array_positions(platforms, 'linux')) <= 1)
);
CREATE OR REPLACE FUNCTION public.reorder_custom_items(kind TEXT, ids UUID[]) RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE table_name TEXT; parent_expression TEXT; changed INTEGER; parents INTEGER;
BEGIN
  CASE kind
    WHEN 'keymaps' THEN table_name := 'custom_keymaps'; parent_expression := 'COALESCE(custom_app_id::text, base_app_slug)';
    WHEN 'sections' THEN table_name := 'custom_sections'; parent_expression := 'keymap_id::text';
    WHEN 'shortcuts' THEN table_name := 'custom_shortcuts'; parent_expression := 'section_id::text';
    ELSE RAISE EXCEPTION 'Unsupported reorder kind';
  END CASE;
  IF cardinality(ids) IS NULL OR cardinality(ids) = 0 THEN RETURN; END IF;
  IF cardinality(ids) <> (SELECT count(DISTINCT id) FROM unnest(ids) AS id) THEN RAISE EXCEPTION 'Duplicate reorder IDs'; END IF;
  EXECUTE format('SELECT count(DISTINCT %s) FROM public.%I WHERE id = ANY($1)', parent_expression, table_name) INTO parents USING ids;
  IF parents <> 1 THEN RAISE EXCEPTION 'Reorder items must belong to the same parent'; END IF;
  EXECUTE format('UPDATE public.%I AS item SET sort_order = ordered.position - 1 FROM unnest($1) WITH ORDINALITY AS ordered(id, position) WHERE item.id = ordered.id', table_name) USING ids;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> cardinality(ids) THEN RAISE EXCEPTION 'Some reorder items are missing or inaccessible'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.reorder_custom_items(TEXT, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_custom_items(TEXT, UUID[]) TO authenticated;
