-- Hotkys User Accounts Schema
-- Safe to rerun in the Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Stores app profile data for Clerk-authenticated users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_clerk_user_id_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_clerk_user_id_key UNIQUE (clerk_user_id);
  END IF;
END $$;

-- Synced user preferences.
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform_filter TEXT CHECK (platform_filter IN ('macos', 'windows', 'linux') OR platform_filter IS NULL),
  view_mode TEXT DEFAULT 'list' CHECK (view_mode IN ('list', 'cheatsheet')),
  column_count INTEGER DEFAULT 4 CHECK (column_count BETWEEN 1 AND 6),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom apps, created entirely by users.
CREATE TABLE IF NOT EXISTS public.custom_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  bundle_id TEXT,
  hostname TEXT,
  source TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Custom keymaps for either custom apps or built-in apps.
CREATE TABLE IF NOT EXISTS public.custom_keymaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  custom_app_id UUID REFERENCES public.custom_apps(id) ON DELETE CASCADE,
  base_app_slug TEXT,
  title TEXT NOT NULL,
  platforms TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT keymap_app_reference CHECK (
    (custom_app_id IS NOT NULL AND base_app_slug IS NULL) OR
    (custom_app_id IS NULL AND base_app_slug IS NOT NULL)
  )
);

-- Custom sections within keymaps.
CREATE TABLE IF NOT EXISTS public.custom_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keymap_id UUID NOT NULL REFERENCES public.custom_keymaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom shortcuts, either new shortcuts or overlays on built-in shortcuts.
CREATE TABLE IF NOT EXISTS public.custom_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.custom_sections(id) ON DELETE CASCADE,
  base_app_slug TEXT,
  base_keymap_title TEXT,
  base_section_title TEXT,
  base_shortcut_title TEXT,
  base_shortcut_id TEXT,
  title TEXT NOT NULL,
  key TEXT,
  comment TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_shortcuts
  ADD COLUMN IF NOT EXISTS base_shortcut_id TEXT;

ALTER TABLE public.custom_shortcuts
  DROP CONSTRAINT IF EXISTS custom_shortcuts_overlay_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'custom_shortcuts_overlay_identity_unique'
      AND conrelid = 'public.custom_shortcuts'::regclass
  ) THEN
    ALTER TABLE public.custom_shortcuts
      ADD CONSTRAINT custom_shortcuts_overlay_identity_unique
      UNIQUE (
        user_id,
        base_app_slug,
        base_keymap_title,
        base_section_title,
        base_shortcut_id
      );
  END IF;
END $$;

-- Favorites.
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('app', 'keymap', 'shortcut')),
  app_slug TEXT,
  keymap_title TEXT,
  shortcut_title TEXT,
  section_title TEXT,
  base_shortcut_id TEXT,
  custom_app_id UUID REFERENCES public.custom_apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS base_shortcut_id TEXT;

ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS custom_keymap_id UUID REFERENCES public.custom_keymaps(id) ON DELETE CASCADE;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS custom_shortcut_id UUID REFERENCES public.custom_shortcuts(id) ON DELETE CASCADE;

-- Bound persisted input sizes before data reaches PostgREST or downstream code.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_text_lengths;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_text_lengths CHECK (
  (clerk_user_id IS NULL OR char_length(clerk_user_id) <= 255) AND
  (display_name IS NULL OR char_length(display_name) <= 100) AND
  (avatar_url IS NULL OR char_length(avatar_url) <= 2048)
);

ALTER TABLE public.custom_apps DROP CONSTRAINT IF EXISTS custom_apps_slug_format;
ALTER TABLE public.custom_apps ADD CONSTRAINT custom_apps_slug_format CHECK (
  slug ~ '^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$'
);
ALTER TABLE public.custom_apps DROP CONSTRAINT IF EXISTS custom_apps_text_lengths;
ALTER TABLE public.custom_apps ADD CONSTRAINT custom_apps_text_lengths CHECK (
  char_length(slug) BETWEEN 1 AND 80 AND
  char_length(name) BETWEEN 1 AND 100 AND
  (bundle_id IS NULL OR char_length(bundle_id) BETWEEN 1 AND 255) AND
  (hostname IS NULL OR char_length(hostname) BETWEEN 1 AND 253) AND
  (source IS NULL OR char_length(source) BETWEEN 1 AND 2048) AND
  (icon IS NULL OR char_length(icon) BETWEEN 1 AND 2048)
);
ALTER TABLE public.custom_apps DROP CONSTRAINT IF EXISTS custom_apps_resource_locations;
ALTER TABLE public.custom_apps ADD CONSTRAINT custom_apps_resource_locations CHECK (
  (source IS NULL OR (
    source !~ '[[:cntrl:]]' AND
    btrim(source) ~* '^https?://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(:(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?([/?#]|$)'
  )) AND
  (icon IS NULL OR (
    btrim(icon) <> '' AND
    icon !~ '[[:cntrl:]]' AND
    (
      btrim(icon) ~* '^https?://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(:(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?([/?#]|$)' OR (
        btrim(icon) !~* '^[a-z][a-z0-9+.-]*:' AND
        left(btrim(icon), 2) <> '//' AND
        left(btrim(icon), 1) <> chr(92)
      )
    )
  ))
);

ALTER TABLE public.custom_keymaps DROP CONSTRAINT IF EXISTS custom_keymaps_text_lengths;
ALTER TABLE public.custom_keymaps ADD CONSTRAINT custom_keymaps_text_lengths CHECK (
  char_length(title) BETWEEN 1 AND 100 AND
  (base_app_slug IS NULL OR char_length(base_app_slug) BETWEEN 1 AND 80) AND
  (platforms IS NULL OR (
    cardinality(platforms) BETWEEN 1 AND 3 AND
    platforms <@ ARRAY['macos', 'windows', 'linux']::TEXT[]
  ))
);

ALTER TABLE public.custom_sections DROP CONSTRAINT IF EXISTS custom_sections_text_lengths;
ALTER TABLE public.custom_sections ADD CONSTRAINT custom_sections_text_lengths CHECK (
  char_length(title) BETWEEN 1 AND 100 AND
  sort_order BETWEEN 0 AND 499
);

ALTER TABLE public.custom_shortcuts DROP CONSTRAINT IF EXISTS custom_shortcuts_text_lengths;
ALTER TABLE public.custom_shortcuts ADD CONSTRAINT custom_shortcuts_text_lengths CHECK (
  char_length(title) BETWEEN 1 AND 50 AND
  (key IS NULL OR char_length(key) BETWEEN 1 AND 255) AND
  (comment IS NULL OR char_length(comment) BETWEEN 1 AND 50) AND
  (base_app_slug IS NULL OR char_length(base_app_slug) BETWEEN 1 AND 80) AND
  (base_keymap_title IS NULL OR char_length(base_keymap_title) BETWEEN 1 AND 100) AND
  (base_section_title IS NULL OR char_length(base_section_title) BETWEEN 1 AND 100) AND
  (base_shortcut_title IS NULL OR char_length(base_shortcut_title) BETWEEN 1 AND 50) AND
  (base_shortcut_id IS NULL OR char_length(base_shortcut_id) BETWEEN 1 AND 1024) AND
  sort_order BETWEEN 0 AND 1999
);

ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_text_lengths;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_text_lengths CHECK (
  (app_slug IS NULL OR char_length(app_slug) BETWEEN 1 AND 87) AND
  (keymap_title IS NULL OR char_length(keymap_title) BETWEEN 1 AND 100) AND
  (shortcut_title IS NULL OR char_length(shortcut_title) BETWEEN 1 AND 50) AND
  (section_title IS NULL OR char_length(section_title) BETWEEN 1 AND 100) AND
  (base_shortcut_id IS NULL OR char_length(base_shortcut_id) BETWEEN 1 AND 1024)
);

-- Indexes for performance and identity.
CREATE INDEX IF NOT EXISTS idx_custom_apps_user ON public.custom_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_keymaps_user ON public.custom_keymaps(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_keymaps_base_app ON public.custom_keymaps(base_app_slug);
CREATE INDEX IF NOT EXISTS idx_custom_keymaps_custom_app ON public.custom_keymaps(custom_app_id);
CREATE INDEX IF NOT EXISTS idx_custom_sections_keymap ON public.custom_sections(keymap_id);
CREATE INDEX IF NOT EXISTS idx_custom_shortcuts_user ON public.custom_shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_shortcuts_base ON public.custom_shortcuts(base_app_slug, base_keymap_title);
CREATE INDEX IF NOT EXISTS idx_custom_shortcuts_section ON public.custom_shortcuts(section_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_app ON public.favorites(app_slug);
CREATE INDEX IF NOT EXISTS idx_favorites_custom_app ON public.favorites(custom_app_id);

DROP INDEX IF EXISTS public.favorites_identity_unique;
CREATE UNIQUE INDEX favorites_identity_unique
  ON public.favorites (
    user_id,
    item_type,
    COALESCE(app_slug, ''),
    COALESCE(keymap_title, ''),
    COALESCE(shortcut_title, ''),
    COALESCE(section_title, ''),
    COALESCE(base_shortcut_id, ''),
    COALESCE(custom_app_id::text, '')
  ) WHERE custom_keymap_id IS NULL AND custom_shortcut_id IS NULL;

-- Row Level Security (RLS).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_keymaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (((select auth.jwt())->>'sub') = clerk_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (((select auth.jwt())->>'sub') = clerk_user_id)
  WITH CHECK (((select auth.jwt())->>'sub') = clerk_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt())->>'sub') = clerk_user_id);

DROP POLICY IF EXISTS "Users can CRUD own preferences" ON public.user_preferences;
CREATE POLICY "Users can CRUD own preferences" ON public.user_preferences
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = user_preferences.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = user_preferences.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

DROP POLICY IF EXISTS "Users can CRUD own custom_apps" ON public.custom_apps;
CREATE POLICY "Users can CRUD own custom_apps" ON public.custom_apps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_apps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_apps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

DROP POLICY IF EXISTS "Users can CRUD own custom_keymaps" ON public.custom_keymaps;
CREATE POLICY "Users can CRUD own custom_keymaps" ON public.custom_keymaps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_keymaps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = custom_keymaps.custom_app_id
          AND custom_apps.user_id = custom_keymaps.user_id
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_keymaps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = custom_keymaps.custom_app_id
          AND custom_apps.user_id = custom_keymaps.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Users can CRUD own custom_sections" ON public.custom_sections;
CREATE POLICY "Users can CRUD own custom_sections" ON public.custom_sections
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.custom_keymaps
      JOIN public.profiles
        ON profiles.id = custom_keymaps.user_id
      WHERE custom_keymaps.id = custom_sections.keymap_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.custom_keymaps
      JOIN public.profiles
        ON profiles.id = custom_keymaps.user_id
      WHERE custom_keymaps.id = custom_sections.keymap_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

DROP POLICY IF EXISTS "Users can CRUD own custom_shortcuts" ON public.custom_shortcuts;
CREATE POLICY "Users can CRUD own custom_shortcuts" ON public.custom_shortcuts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_shortcuts.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      section_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_sections
        JOIN public.custom_keymaps
          ON custom_keymaps.id = custom_sections.keymap_id
        WHERE custom_sections.id = custom_shortcuts.section_id
          AND custom_keymaps.user_id = custom_shortcuts.user_id
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_shortcuts.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      section_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_sections
        JOIN public.custom_keymaps
          ON custom_keymaps.id = custom_sections.keymap_id
        WHERE custom_sections.id = custom_shortcuts.section_id
          AND custom_keymaps.user_id = custom_shortcuts.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Users can CRUD own favorites" ON public.favorites;
CREATE POLICY "Users can CRUD own favorites" ON public.favorites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = favorites.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = favorites.custom_app_id
          AND custom_apps.user_id = favorites.user_id
      )
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = favorites.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = favorites.custom_app_id
          AND custom_apps.user_id = favorites.user_id
      )
    )
  );

-- Clerk OAuth access tokens use anon; the website uses authenticated.
-- Raycast reads customizations and only writes its own profile/favorites.
-- Keep issuer, subject and parent-ownership checks; leave website policies intact.

DROP POLICY IF EXISTS "Clerk OAuth users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clerk OAuth users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clerk OAuth users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clerk OAuth users can CRUD own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk OAuth users can CRUD own custom_apps" ON public.custom_apps;
DROP POLICY IF EXISTS "Clerk OAuth users can CRUD own custom_keymaps" ON public.custom_keymaps;
DROP POLICY IF EXISTS "Clerk OAuth users can CRUD own custom_sections" ON public.custom_sections;
DROP POLICY IF EXISTS "Clerk OAuth users can CRUD own custom_shortcuts" ON public.custom_shortcuts;
DROP POLICY IF EXISTS "Clerk OAuth users can CRUD own favorites" ON public.favorites;

REVOKE ALL ON TABLE public.profiles, public.user_preferences, public.custom_apps,
  public.custom_keymaps, public.custom_sections, public.custom_shortcuts, public.favorites FROM anon;
GRANT SELECT, INSERT ON TABLE public.profiles TO anon;
GRANT SELECT ON TABLE public.custom_apps, public.custom_keymaps,
  public.custom_sections, public.custom_shortcuts TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.favorites TO anon;

CREATE POLICY "Clerk OAuth users can view own profile" ON public.profiles
  FOR SELECT TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND ((select auth.jwt())->>'sub') = clerk_user_id
  );

CREATE POLICY "Clerk OAuth users can insert own profile" ON public.profiles
  FOR INSERT TO anon
  WITH CHECK (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND ((select auth.jwt())->>'sub') = clerk_user_id
  );

DROP POLICY IF EXISTS "Clerk OAuth users can view own custom_apps" ON public.custom_apps;
CREATE POLICY "Clerk OAuth users can view own custom_apps" ON public.custom_apps
  FOR SELECT TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_apps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

DROP POLICY IF EXISTS "Clerk OAuth users can view own custom_keymaps" ON public.custom_keymaps;
CREATE POLICY "Clerk OAuth users can view own custom_keymaps" ON public.custom_keymaps
  FOR SELECT TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_keymaps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = custom_keymaps.custom_app_id
          AND custom_apps.user_id = custom_keymaps.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Clerk OAuth users can view own custom_sections" ON public.custom_sections;
CREATE POLICY "Clerk OAuth users can view own custom_sections" ON public.custom_sections
  FOR SELECT TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.custom_keymaps
      JOIN public.profiles
        ON profiles.id = custom_keymaps.user_id
      WHERE custom_keymaps.id = custom_sections.keymap_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

DROP POLICY IF EXISTS "Clerk OAuth users can view own custom_shortcuts" ON public.custom_shortcuts;
CREATE POLICY "Clerk OAuth users can view own custom_shortcuts" ON public.custom_shortcuts
  FOR SELECT TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_shortcuts.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      section_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_sections
        JOIN public.custom_keymaps
          ON custom_keymaps.id = custom_sections.keymap_id
        WHERE custom_sections.id = custom_shortcuts.section_id
          AND custom_keymaps.user_id = custom_shortcuts.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Clerk OAuth users can view own favorites" ON public.favorites;
CREATE POLICY "Clerk OAuth users can view own favorites" ON public.favorites
  FOR SELECT TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = favorites.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = favorites.custom_app_id
          AND custom_apps.user_id = favorites.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Clerk OAuth users can insert own favorites" ON public.favorites;
CREATE POLICY "Clerk OAuth users can insert own favorites" ON public.favorites
  FOR INSERT TO anon
  WITH CHECK (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = favorites.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = favorites.custom_app_id
          AND custom_apps.user_id = favorites.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Clerk OAuth users can delete own favorites" ON public.favorites;
CREATE POLICY "Clerk OAuth users can delete own favorites" ON public.favorites
  FOR DELETE TO anon
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = favorites.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
    AND (
      custom_app_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.custom_apps
        WHERE custom_apps.id = favorites.custom_app_id
          AND custom_apps.user_id = favorites.user_id
      )
    )
  );

-- Keep updated_at fresh on mutable user tables.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_custom_apps_updated_at ON public.custom_apps;
CREATE TRIGGER set_custom_apps_updated_at
  BEFORE UPDATE ON public.custom_apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_custom_keymaps_updated_at ON public.custom_keymaps;
CREATE TRIGGER set_custom_keymaps_updated_at
  BEFORE UPDATE ON public.custom_keymaps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_custom_shortcuts_updated_at ON public.custom_shortcuts;
CREATE TRIGGER set_custom_shortcuts_updated_at
  BEFORE UPDATE ON public.custom_shortcuts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Serialize inserts per user/table and reject rows beyond free-account quotas.
CREATE OR REPLACE FUNCTION public.enforce_user_row_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_id UUID;
  current_count BIGINT;
  max_rows INTEGER := TG_ARGV[0]::INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'custom_sections' THEN
    SELECT user_id INTO owner_id
    FROM public.custom_keymaps
    WHERE id = NEW.keymap_id;
  ELSE
    owner_id := NEW.user_id;
  END IF;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Unable to determine resource owner'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(owner_id::TEXT),
    hashtext(TG_TABLE_NAME)
  );

  CASE TG_TABLE_NAME
    WHEN 'custom_apps' THEN
      SELECT count(*) INTO current_count
      FROM public.custom_apps WHERE user_id = owner_id;
    WHEN 'custom_keymaps' THEN
      SELECT count(*) INTO current_count
      FROM public.custom_keymaps WHERE user_id = owner_id;
    WHEN 'custom_sections' THEN
      SELECT count(*) INTO current_count
      FROM public.custom_sections
      JOIN public.custom_keymaps
        ON custom_keymaps.id = custom_sections.keymap_id
      WHERE custom_keymaps.user_id = owner_id;
    WHEN 'custom_shortcuts' THEN
      SELECT count(*) INTO current_count
      FROM public.custom_shortcuts WHERE user_id = owner_id;
    WHEN 'favorites' THEN
      SELECT count(*) INTO current_count
      FROM public.favorites WHERE user_id = owner_id;
    ELSE
      RAISE EXCEPTION 'Unsupported quota table: %', TG_TABLE_NAME;
  END CASE;

  IF current_count >= max_rows THEN
    RAISE EXCEPTION 'Resource limit reached for % (maximum %)',
      TG_TABLE_NAME,
      max_rows
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS custom_apps_user_quota ON public.custom_apps;
CREATE TRIGGER custom_apps_user_quota
  BEFORE INSERT ON public.custom_apps
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_row_quota('25');

DROP TRIGGER IF EXISTS custom_keymaps_user_quota ON public.custom_keymaps;
CREATE TRIGGER custom_keymaps_user_quota
  BEFORE INSERT ON public.custom_keymaps
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_row_quota('100');

DROP TRIGGER IF EXISTS custom_sections_user_quota ON public.custom_sections;
CREATE TRIGGER custom_sections_user_quota
  BEFORE INSERT ON public.custom_sections
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_row_quota('500');

DROP TRIGGER IF EXISTS custom_shortcuts_user_quota ON public.custom_shortcuts;
CREATE TRIGGER custom_shortcuts_user_quota
  BEFORE INSERT ON public.custom_shortcuts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_row_quota('2000');

DROP TRIGGER IF EXISTS favorites_user_quota ON public.favorites;
CREATE TRIGGER favorites_user_quota
  BEFORE INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_row_quota('500');

-- Clerk auth creates profiles lazily from the app client.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM authenticated;
REVOKE ALL ON FUNCTION public.enforce_user_row_quota() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_user_row_quota() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_user_row_quota() FROM authenticated;

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

ALTER TABLE public.custom_shortcuts ADD COLUMN IF NOT EXISTS key_is_cleared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.custom_shortcuts ADD COLUMN IF NOT EXISTS comment_is_cleared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.custom_shortcuts DROP CONSTRAINT IF EXISTS custom_shortcuts_clear_fields;
ALTER TABLE public.custom_shortcuts ADD CONSTRAINT custom_shortcuts_clear_fields CHECK (
  (NOT key_is_cleared OR key IS NULL) AND (NOT comment_is_cleared OR comment IS NULL) AND
  (NOT (key_is_cleared OR comment_is_cleared) OR base_app_slug IS NOT NULL)
);

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

-- Private app editing and stable favorites. Keep in sync with the additive migration.
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
