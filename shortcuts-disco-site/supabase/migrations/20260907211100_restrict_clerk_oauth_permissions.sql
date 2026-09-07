BEGIN;

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

COMMIT;
