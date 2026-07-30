# Raycast User Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add secure Clerk PKCE authentication, favorites, and read/run support for website custom shortcuts to the Raycast extension without a custom backend.

**Architecture:** Raycast securely stores Clerk OAuth tokens and supplies the current JWT to `supabase-js`. Pure mapping, identity, merging, and favorite functions are tested independently from Raycast UI, while thin hooks and commands connect them to existing lists.

**Tech Stack:** TypeScript, React, Raycast API, Clerk OAuth 2.0/OIDC with PKCE, Supabase JavaScript client, PostgreSQL RLS, Jest.

---

### Task 1: Public configuration and OAuth token exchange

**Files:**
- Create: `shortcuts-raycast-extension/src/auth/config.ts`
- Create: `shortcuts-raycast-extension/src/auth/token-exchange.ts`
- Test: `shortcuts-raycast-extension/src/auth/token-exchange.spec.ts`

**Steps:**

1. Write tests that require authorization-code and refresh requests to use
   form encoding, the public client ID, PKCE verifier, redirect URI, and
   preserved refresh tokens.
2. Run `npm test -- --runInBand src/auth/token-exchange.spec.ts` and verify it
   fails because the module does not exist.
3. Implement the two token request functions with injected `fetch`, strict
   response validation, and useful OAuth errors.
4. Run the focused test and the complete extension test suite.
5. Commit with `feat(raycast): add Clerk OAuth token exchange`.

### Task 2: Raycast OAuth session and Supabase client

**Files:**
- Create: `shortcuts-raycast-extension/src/auth/session.ts`
- Create: `shortcuts-raycast-extension/src/user-data/supabase-client.ts`
- Modify: `shortcuts-raycast-extension/package.json`
- Modify: `shortcuts-raycast-extension/package-lock.json`

**Steps:**

1. Write tests for the session decision logic: reuse valid tokens, refresh
   expired tokens, preserve refresh tokens, and require authorization only when
   requested.
2. Verify the tests fail for the missing behavior.
3. Install the exact site-compatible `@supabase/supabase-js` version.
4. Implement the `OAuth.PKCEClient` wrapper and a singleton Supabase client
   whose `accessToken` callback obtains the current Clerk token.
5. Run tests, lint, and build.
6. Commit with `feat(raycast): connect Clerk OAuth to Supabase`.

### Task 3: User-data models, mapping, and queries

**Files:**
- Create: `shortcuts-raycast-extension/src/user-data/models.ts`
- Create: `shortcuts-raycast-extension/src/user-data/mappers.ts`
- Create: `shortcuts-raycast-extension/src/user-data/service.ts`
- Test: `shortcuts-raycast-extension/src/user-data/mappers.spec.ts`
- Test: `shortcuts-raycast-extension/src/user-data/favorites.spec.ts`

**Steps:**

1. Write mapping tests using representative nested rows from all custom tables
   and favorites.
2. Write favorite identity tests covering null fields and stable base shortcut
   IDs.
3. Verify both suites fail.
4. Implement profile lookup, customization reads, favorite reads, add/remove,
   and toggle operations using only the current profile ID.
5. Run focused and complete tests.
6. Commit with `feat(raycast): add private user data service`.

### Task 4: Custom shortcut merger

**Files:**
- Modify: `shortcuts-raycast-extension/src/model/internal/internal-models.ts`
- Create: `shortcuts-raycast-extension/src/user-data/shortcut-identity.ts`
- Create: `shortcuts-raycast-extension/src/user-data/shortcut-merger.ts`
- Test: `shortcuts-raycast-extension/src/user-data/shortcut-merger.spec.ts`

**Steps:**

1. Port tests for custom apps, custom sections, duplicate-title overlays,
   deleted shortcuts, ordering, and stale legacy overlays.
2. Verify the tests fail because merging is absent.
3. Implement stable identity generation and the website-equivalent merger.
4. Run focused tests and all parser tests.
5. Commit with `feat(raycast): merge custom shortcuts`.

### Task 5: Providers, commands, and favorite actions

**Files:**
- Create: `shortcuts-raycast-extension/src/load/user-data-provider.ts`
- Create: `shortcuts-raycast-extension/src/my-favorites.tsx`
- Create: `shortcuts-raycast-extension/src/my-shortcuts.tsx`
- Create: `shortcuts-raycast-extension/src/view/favorite-actions.tsx`
- Modify: `shortcuts-raycast-extension/src/all-shortcuts.tsx`
- Modify: `shortcuts-raycast-extension/src/app-shortcuts.tsx`
- Modify: `shortcuts-raycast-extension/src/web-shortcuts.tsx`
- Modify: `shortcuts-raycast-extension/src/load/apps-provider.ts`
- Modify: `shortcuts-raycast-extension/src/load/app-shortcuts-provider.ts`
- Modify: `shortcuts-raycast-extension/src/view/shortcuts-list.tsx`
- Modify: `shortcuts-raycast-extension/package.json`

**Steps:**

1. Write pure view-model tests for resolving favorite app/keymap/shortcut
   targets and selecting only customized applications.
2. Verify the tests fail.
3. Add optional authenticated enrichment to existing commands.
4. Add authenticated Favorites and My Shortcuts commands with empty, loading,
   error, and sign-in states.
5. Add favorite actions that mutate Supabase then revalidate cached user data.
6. Run tests, lint, and build.
7. Commit with `feat(raycast): add favorites and custom shortcut commands`.

### Task 6: Production-safe RLS migration

**Files:**
- Create through `supabase migration new`: `shortcuts-disco-site/supabase/migrations/*_allow_clerk_oauth_rls.sql`
- Modify: `shortcuts-disco-site/supabase/schema.sql`
- Test: `shortcuts-disco-site/src/lib/services/user-content-schema.spec.ts`

**Steps:**

1. Add failing schema assertions that every private policy accepts `anon` and
   `authenticated`, requires the production Clerk issuer, and keeps its
   ownership predicate.
2. Verify the focused site test fails.
3. Generate the migration with the Supabase CLI and implement explicit policy
   replacements.
4. Update the declarative schema to match.
5. Run site tests and build before applying anything remotely.
6. Run Supabase security/performance advisors and review current policies.
7. Commit with `fix(auth): allow verified Clerk OAuth tokens through RLS`.

### Task 7: Clerk configuration and live verification

**External configuration:**
- Create production Clerk OAuth application `Hotkys for Raycast`.
- Configure public client, PKCE, JWT access tokens, consent screen, and
  `https://raycast.com/redirect?packageName=Extension`.

**Steps:**

1. Configure the OAuth application in the authenticated Clerk dashboard and
   record only the public client ID in `src/auth/config.ts`.
2. Build and run the extension locally, complete sign-in, and inspect the actual
   access-token claims without exposing the token.
3. Confirm the pre-migration token cannot read private rows.
4. Apply the reviewed migration once.
5. Confirm the token can read only its own profile/favorites/customizations.
6. Confirm a publishable-key-only request cannot read or mutate private rows.
7. Run security and performance advisors again.

### Task 8: Final verification and documentation

**Files:**
- Modify: `shortcuts-raycast-extension/README.md`
- Modify: `shortcuts-raycast-extension/CHANGELOG.md`

**Steps:**

1. Document the two commands, sign-in behavior, website authoring boundary, and
   logout behavior.
2. Run extension tests, lint, and production build.
3. Run site tests, lint, and static production build.
4. Run `git diff --check`, review the complete diff, and verify no secret or
   service-role value is present.
5. Use the finishing-a-development-branch skill to prepare the final handoff.
