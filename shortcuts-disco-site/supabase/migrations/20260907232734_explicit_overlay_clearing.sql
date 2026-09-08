ALTER TABLE public.custom_shortcuts ADD COLUMN IF NOT EXISTS key_is_cleared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.custom_shortcuts ADD COLUMN IF NOT EXISTS comment_is_cleared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.custom_shortcuts DROP CONSTRAINT IF EXISTS custom_shortcuts_clear_fields;
ALTER TABLE public.custom_shortcuts ADD CONSTRAINT custom_shortcuts_clear_fields CHECK (
  (NOT key_is_cleared OR key IS NULL) AND (NOT comment_is_cleared OR comment IS NULL) AND
  (NOT (key_is_cleared OR comment_is_cleared) OR base_app_slug IS NOT NULL)
);
