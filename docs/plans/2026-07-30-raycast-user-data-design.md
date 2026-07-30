# Raycast Favorites and Custom Shortcuts Design

## Architecture

The Raycast extension will use the same data plane as the static website. A
Raycast `OAuth.PKCEClient` will authenticate against the production Clerk
issuer at `https://clerk.hotkys.com`. Clerk will issue a refreshable,
asymmetrically signed JWT access token to a public client; the extension will
store the token set in Raycast's secure OAuth storage. A Supabase client will
receive the current access token through its `accessToken` callback and will
query the existing `profiles`, `favorites`, `custom_apps`, `custom_keymaps`,
`custom_sections`, and `custom_shortcuts` tables directly.

The public shortcut catalog remains available without authentication. Existing
commands must never prompt for sign-in merely to show public shortcuts. The new
Favorites and My Shortcuts commands will start the OAuth flow when necessary.
Once a user has authenticated, the public commands may silently load and merge
their private customizations. Favorite actions in public lists may prompt for
authentication because the user's explicit action requires private storage.

No service-role key, Clerk client secret, server route, or Edge Function will be
shipped. The Clerk OAuth client ID, Supabase URL, and Supabase publishable key
are public client configuration.

## User Experience and Data Flow

The extension adds two view commands:

- **My Favorites** lists saved apps, keymaps, and shortcuts and lets the user
  open, run, or remove each item.
- **My Shortcuts** lists custom applications and official applications that
  contain custom keymaps, sections, shortcuts, or overlays.

Existing application and shortcut lists gain favorite/unfavorite actions.
Authenticated users see custom applications alongside official applications,
and custom keymaps, sections, shortcuts, deletions, and overlays are merged
with the downloaded public catalog using the website's stable shortcut identity
rules. Custom authoring remains on the website for the initial Raycast release;
Raycast is a read/run/favorite client.

OAuth access tokens are refreshed before expiry. A failed refresh removes the
invalid local token and presents a clear reauthentication error instead of
retrying indefinitely. Supabase query errors are surfaced as Raycast failure
toasts. Public data remains usable when optional private sync fails.

## Production Security and Rollout

Supabase assigns a third-party JWT without a `role` claim to the `anon`
Postgres role. Clerk OAuth access tokens contain a signed user `sub` but do not
support adding the website's custom session-token role claim. The relevant RLS
policies must therefore target both `anon` and `authenticated` while retaining
their existing ownership predicates. Each policy will also require the exact
Clerk issuer:

```sql
((select auth.jwt())->>'iss') = 'https://clerk.hotkys.com'
AND ((select auth.jwt())->>'sub') = profiles.clerk_user_id
```

An API request with only the publishable key has no Clerk issuer or user
subject and therefore cannot satisfy the policy. A forged subject cannot pass
JWT verification because Supabase trusts only the configured Clerk issuer and
its JWKS.

Rollout is deliberately ordered: implement and test locally; create a public
PKCE Clerk application with consent enabled and JWT access tokens; obtain a real
test token; prove the current policies reject the OAuth role; apply the reviewed
migration; prove the token can access only its own profile/data; prove an
unauthenticated request still returns no private rows; run Supabase security
advisors and the complete repository checks.
