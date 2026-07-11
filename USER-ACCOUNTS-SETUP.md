# User Accounts Setup - Clerk Auth + Supabase Database

The original Supabase project `nemgehycfkwnjeomapim` is permanently paused and
could not be restored. The active replacement project is `pnzstacjwokxqvtxoeyp`
(`Hotkys Active`).

## Completed

- [x] Supabase project created
- [x] Supabase database schema added for profiles, preferences, favorites, and custom shortcuts
- [x] Client app migrated from Supabase Auth to Clerk auth
- [x] Supabase database client configured to use Clerk session tokens
- [x] RLS changed to authorize through `profiles.clerk_user_id = auth.jwt()->>'sub'`
- [x] `.env.local` configured with Supabase URL and publishable key
- [x] Clerk development app configured for Google sign-in and email links
- [x] Dedicated Google Cloud project `hotkys` created for Hotkys OAuth
- [x] Clerk Google custom credentials configured from the dedicated Hotkys Google OAuth client
- [x] Older rotated Google OAuth client secret disabled
- [x] GitHub Pages environment variables configured for Clerk and Supabase public build settings
- [x] GitHub Pages Clerk key switched from development `pk_test_...` to production `pk_live_...`
- [x] Clerk development and production instances connected to the active Supabase project
- [x] SSG-compatible auth wrapper
- [x] Branch rebased onto current `origin/main`

## Remaining Setup

### 1. Create or Open the Clerk App

In the Clerk Dashboard:

1. Enable Google sign-in.
2. Enable email link sign-in.
3. Disable password sign-in if you want only Google and magic links.
4. Copy the publishable key into `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

This app is a static export, so it uses Clerk's React SDK on the client instead
of Clerk's Next.js middleware/server helpers.

#### Cross-device magic links

Hotkys intentionally leaves Clerk's **Require the same device and browser**
setting disabled for email-link sign-in and sign-up. This lets a user request a
magic link on one device and open it on another.

This is an accepted security tradeoff. A magic link is a bearer credential
during its validity window, so anyone who obtains the link can complete sign-in
from another browser or device. The current controls are Clerk's short-lived
links and verified-email flow, HTTPS in production, Supabase row-level security,
and the absence of password authentication. Revisit this decision before adding
billing, administrator access, shared private content, or other privileged
account actions.

### 2. Connect Clerk to Supabase

Use Clerk's Supabase integration setup, then add Clerk as a Supabase third-party
auth provider:

1. In Clerk, open the Supabase integration setup and activate it.
2. Copy the Clerk domain shown by the integration.
3. In Supabase, go to Authentication -> Sign In / Providers.
4. Add the Clerk provider and paste the Clerk domain.

Do not use the deprecated Clerk JWT template. Supabase now supports Clerk as a
third-party auth provider directly.

### 3. Apply the Supabase Schema

Run `shortcuts-disco-site/supabase/schema.sql` in the active Supabase project.
The schema is idempotent and safe to rerun.

### 4. Test Authentication

```bash
cd shortcuts-disco-site
npm run dev -- --port 3001
```

Visit `http://localhost:3001/auth/login` and test:

- [ ] Google sign-in
- [ ] Email link sign-in
- [ ] Add/remove a favorite
- [ ] Save platform preferences

Local development uses Clerk's shared Google OAuth client even when custom
Google credentials are configured in the Clerk dashboard. The dedicated Hotkys
Google OAuth client is used by Clerk production instances.

### 5. Before Production

1. Add the production app URL in Clerk.
2. Set Clerk and Supabase environment variables in hosting.
   - GitHub Pages deployment is intentionally blocked unless `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_live_`.
3. Confirm the Supabase third-party Clerk provider is enabled in production.
4. Confirm the production Clerk instance uses the dedicated Hotkys Google OAuth
   client from Google Cloud project `hotkys`.
