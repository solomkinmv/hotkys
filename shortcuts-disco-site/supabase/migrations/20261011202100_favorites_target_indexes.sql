CREATE INDEX IF NOT EXISTS favorites_custom_keymap_id_idx ON public.favorites (custom_keymap_id) WHERE custom_keymap_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS favorites_custom_shortcut_id_idx ON public.favorites (custom_shortcut_id) WHERE custom_shortcut_id IS NOT NULL;
