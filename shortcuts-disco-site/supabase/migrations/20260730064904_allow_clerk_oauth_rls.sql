-- Clerk OAuth access tokens are verified by Supabase third-party auth but do
-- not carry a Postgres role claim, so PostgREST evaluates them as `anon`.
-- Keep both the browser session role and the OAuth role while requiring the
-- exact production Clerk issuer and signed user subject in every policy.

ALTER POLICY "Users can view own profile" ON public.profiles
  TO anon, authenticated
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND ((select auth.jwt())->>'sub') = clerk_user_id
  );

ALTER POLICY "Users can update own profile" ON public.profiles
  TO anon, authenticated
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND ((select auth.jwt())->>'sub') = clerk_user_id
  )
  WITH CHECK (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND ((select auth.jwt())->>'sub') = clerk_user_id
  );

ALTER POLICY "Users can insert own profile" ON public.profiles
  TO anon, authenticated
  WITH CHECK (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND ((select auth.jwt())->>'sub') = clerk_user_id
  );

ALTER POLICY "Users can CRUD own preferences" ON public.user_preferences
  TO anon, authenticated
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = user_preferences.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  )
  WITH CHECK (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = user_preferences.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

ALTER POLICY "Users can CRUD own custom_apps" ON public.custom_apps
  TO anon, authenticated
  USING (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_apps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  )
  WITH CHECK (
    ((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = custom_apps.user_id
        AND profiles.clerk_user_id = ((select auth.jwt())->>'sub')
    )
  );

ALTER POLICY "Users can CRUD own custom_keymaps" ON public.custom_keymaps
  TO anon, authenticated
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
  )
  WITH CHECK (
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

ALTER POLICY "Users can CRUD own custom_sections" ON public.custom_sections
  TO anon, authenticated
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
  )
  WITH CHECK (
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

ALTER POLICY "Users can CRUD own custom_shortcuts" ON public.custom_shortcuts
  TO anon, authenticated
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
  )
  WITH CHECK (
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

ALTER POLICY "Users can CRUD own favorites" ON public.favorites
  TO anon, authenticated
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
  )
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
