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
  title TEXT NOT NULL,
  key TEXT,
  comment TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'custom_shortcuts_overlay_unique'
      AND conrelid = 'public.custom_shortcuts'::regclass
  ) THEN
    ALTER TABLE public.custom_shortcuts
      ADD CONSTRAINT custom_shortcuts_overlay_unique
      UNIQUE (
        user_id,
        base_app_slug,
        base_keymap_title,
        base_section_title,
        base_shortcut_title
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
  custom_app_id UUID REFERENCES public.custom_apps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE UNIQUE INDEX IF NOT EXISTS favorites_identity_unique
  ON public.favorites (
    user_id,
    item_type,
    COALESCE(app_slug, ''),
    COALESCE(keymap_title, ''),
    COALESCE(shortcut_title, ''),
    COALESCE(section_title, ''),
    COALESCE(custom_app_id::text, '')
  );

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
  USING ((select auth.jwt()->>'sub') = clerk_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.jwt()->>'sub') = clerk_user_id)
  WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.jwt()->>'sub') = clerk_user_id);

DROP POLICY IF EXISTS "Users can CRUD own preferences" ON public.user_preferences;
CREATE POLICY "Users can CRUD own preferences" ON public.user_preferences
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = user_preferences.user_id
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = user_preferences.user_id
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_apps.user_id
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.custom_keymaps
      JOIN public.profiles
        ON profiles.id = custom_keymaps.user_id
      WHERE custom_keymaps.id = custom_sections.keymap_id
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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
        AND profiles.clerk_user_id = (select auth.jwt()->>'sub')
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

-- Clerk auth creates profiles lazily from the app client.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM authenticated;
