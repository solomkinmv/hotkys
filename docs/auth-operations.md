# Authentication and database operations

This is an operations contract, not proof of hosted dashboard state. Production dashboard settings and provider flows require operator verification. Public catalog browsing works without accounts; partially configured accounts fail configuration checks rather than appearing usable.

## Environment modes

Run `npm run check:config -- --mode public|test|production` inside `shortcuts-disco-site`. Builds and development use `--mode auto`: no configuration selects public mode, `pk_test_` selects test, `pk_live_` selects production. Diagnostics report field names and mode, never key values.

| Mode | Website requirements | Database / extension |
| --- | --- | --- |
| Public | Unset all Clerk and Supabase variables | No private features; public catalog available |
| Test | Clerk test publishable key; dedicated HTTPS Supabase URL; one public database key | Separate database and dedicated test users. Do not point test Clerk at production Supabase |
| Production | Live Clerk key for `clerk.hotkys.com`; `https://pnzstacjwokxqvtxoeyp.supabase.co`; one matching public database key | Verify integration issuer and deployed migrations |

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, never both. Legacy keys must have the `anon` role. Server/secret keys must not enter `NEXT_PUBLIC_*`. Local examples contain placeholders; do not copy them unchanged into an enabled account environment. Production checks verify expected issuer/project values and key shape, not whether a publishable key belongs to that project or the hosted integration accepts tokens.

Raycast's public configuration is checked in at `shortcuts-raycast-extension/src/auth/config.ts`. Its catalog development override does not override auth. For a designated test extension, use a separate local configuration/registration and verify issuer, OAuth client ID, Supabase URL and public key as one set. Never test writes against production merely because the public defaults exist.

## Hosted configuration to verify

Clerk remains the identity provider; Supabase stores user content. Enable Google and email-link sign-in in the designated Clerk instance. Preserve the accepted cross-device email-link setting; verify it by opening a newly requested link on the other device. Do not replace it with a same-device-only policy during setup.

Website requests obtain Clerk's session token through the session-scoped Supabase access-token callback. Verify the configured Clerk/Supabase third-party integration and its `authenticated` role behavior. The website client captures the session/account and rejects requests from stale sessions; it does not reuse a mutable global token getter across accounts.

Raycast uses a public OAuth client, PKCE, the Web redirect `https://raycast.com/redirect?packageName=Extension`, authorization/token endpoints below `https://clerk.hotkys.com/oauth`, and scopes `profile email offline_access`. Verify callback allowlisting, public-client mode, JWT access-token behavior, and refresh support in the dashboard. Do not add a client secret to the extension.

Current OAuth database policies are `anon` policies constrained by the trusted Clerk issuer and subject-to-profile mapping; website policies target `authenticated`. The added restrictive favorite-reference policy narrows ownership for both paths. Anonymous requests without a verified identity must still see no private rows. Do not infer successful hosted JWT verification from local claim fixtures. Inspect real redacted claims before introducing an audience/client restriction; do not assume an `aud` or role value not demonstrated by the provider.

Raycast provides native OAuth logout. In-command Disconnect invalidates local state and serializes owned credential writes/removal. Refresh/authorization responses are discarded if their captured credentials or generation changed. Native store changes are rechecked before persistence and when loading private data; actual native logout timing remains an acceptance scenario.

## Fresh setup and upgrades

For a new empty project, apply `shortcuts-disco-site/supabase/schema.sql` using the chosen project SQL workflow, then verify RLS/grants. For an existing project, inspect its migration ledger and apply outstanding migrations in timestamp order; do not reinitialize it with the schema snapshot.

New additive migrations:

1. `20260907232559_stable_custom_favorite_references.sql`: nullable stable custom keymap/shortcut references, ownership checks, and unambiguous private-app backfill. Legacy base-app label matches remain unresolved rather than guessed.
2. `20260907232734_explicit_overlay_clearing.sql`: explicit clear flags. Null without a flag inherits, a value replaces, flag plus null clears. Contradictory combinations are rejected.
3. `20260907233528_authoring_structure_integrity.sql`: ordering, unique titles within parents, platform constraints, and a permission-checked reorder function.

The integrity migration deliberately aborts on pre-existing duplicate keymap/section titles. Inventory collisions by parent with `GROUP BY ... HAVING count(*) > 1`, show the operator the affected drafts, and resolve them before retrying. Do not silently merge or delete user drafts. Back up the designated project before applying changes.

The Supabase CLI supports `supabase migration new <name>` and `supabase db push --dry-run`. Confirm the selected project/connection and pending migration list before an authorized push. Never paste database passwords in shell history or diagnostics. Local implementation does not authorize production migration application.

Run `npm run test:rls` for permissions, quota behavior, stable references, clearing, fresh schema, and upgrade fixtures. Run `npm run test:db:concurrency` only with `HOTKYS_TEST_DATABASE_URL` pointing at an explicitly disposable local/test PostgreSQL instance; it tests competing writes with actual independent connections. Claim mocks/PGlite are not hosted integration verification.

## Acceptance with dedicated accounts

Record environment, timestamp, application revision, migration versions, and two designated test-user labels A/B. Never record passwords or full access/refresh/ID tokens.

1. In the website, sign in with Google as A, create a desktop draft and a web draft, correct source/hostname/platforms/rows/order, then export and validate both JSON files. Confirm exports contain only public fields.
2. Add app/keymap/shortcut favorites. Rename private content and verify stable favorites; delete an unresolved favorite by its row ID. Confirm deleting a private parent cascades only its own stable references.
3. Start slow private reads/writes, sign out, then sign in as B. Confirm A's private data disappears, stale work cannot repopulate B, and B cannot read or mutate A's IDs. Exercise each custom table, favorites, preferences, and profile reads.
4. Request a fresh email link and finish on another device. Check redirect restoration for private routes. Record visible provider errors without token-bearing URLs.
5. In Raycast, authorize, cancel, reconnect, retry an offline sync, use native logout, and disconnect during refresh. Switch A/B with an active command and verify private state clearing. Public search must remain usable during OAuth/database failure.
6. Verify real hosted requests for anonymous denial, website A/B ownership, and OAuth A/B ownership. Safe evidence includes HTTP status, operation/table, environment, expected issuer, role/claim names, and a masked subject. Never log request Authorization headers.

## Release sequence and rollback

Keep `NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING` unset or `false` until migrations are verified and a compatible Raycast reader is actually available to users. Apply additive database changes, release/verify compatible extension readers, then enable website clear-field writes and verify affected routes on the deployed revision. Disabling the website flag reverses the UI rollout; retain populated columns and legacy references.

Deployment, store release, hosted dashboard changes, and production migration execution need explicit authorization. Local tests do not establish that those steps occurred. See [implementation verification](verification/project-remediation.md) for the evidence actually collected.

## Ambiguous legacy shortcut identities

The old website mapped Command to Control on Windows/Linux. When that old ID could identify more than one current shortcut, neither client guesses the target. A current row whose ordinary ID collides receives a `v2:` ID; new saves use that ID. Unambiguous old IDs (including the old literal-plus parser output) remain aliases. Existing ambiguous favorites remain removable by their stored row ID. Recreate an ambiguous favorite or customization against the intended current row after checking it; do not bulk-map by title.
