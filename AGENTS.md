# Hotkys — Repository Guidelines

Hotkys (repository `shortcuts-disco`) is a keyboard-shortcut catalog published at https://hotkys.com, plus a macOS/Windows Raycast extension that reads the published catalog and can execute shortcuts. Optional Clerk accounts store private apps, overlays, preferences and favorites in Supabase.

## Project map

| Directory                             | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `shortcuts-disco-site`                | Next.js static export (`output: "export"`) deployed to GitHub Pages         |
| `shortcuts-disco-site/shortcuts-data` | Public catalog: one JSON file per app, schema in `schema/shortcut.schema.json` |
| `shortcuts-disco-site/supabase`       | `schema.sql` snapshot, timestamped `migrations/`, PGlite database tests     |
| `shortcuts-raycast-extension`         | Raycast extension `shortcuts-search` (macOS and Windows)                    |
| `shared/shortcuts-core`               | Source of the shortcut parser/identity/merge logic copied into both apps    |
| `scripts`                             | Shared-core sync and catalog verification                                   |
| `docs`                                | Auth operations and Windows acceptance checklist                            |

The apps are independent npm projects with their own lockfiles; there is no root package. Use Node.js 22+ (site `engines`, CI). Read `CONTRIBUTING.md` for catalog grammar and the full local check list, and `docs/auth-operations.md` before account, Supabase or Clerk work.

## Commands

Site (`shortcuts-disco-site`): `dev` (watches catalog sources and runs `next dev`), `optimize-images` (site-only WebP variants of `public/icons`, the logo and hero into `public/optimized/`; run by `build` and `predev`), `test` (Jest, colocated `*.spec.ts(x)`), `test:types`, `lint`, `build` (exports data, outputs `out/`), `validate-data`, `format-data:check`, `prettify -- --write <file>`, `test:catalog`, `test:rls` (PGlite RLS/schema/migration tests), `check:config -- --mode public|test|production`. `predev`/`prebuild` run `check:config -- --mode auto`. `test:db:concurrency` needs a disposable `HOTKYS_TEST_DATABASE_URL`.

Raycast (`shortcuts-raycast-extension`): `test`, `test:types`, `lint`/`fix-lint` (`ray lint`), `build`, `dev`, `dev:catalog -- --origin http://localhost:3000` (temporary local catalog). Do not run `publish` unless asked.

From the root: `node scripts/sync-shortcuts-core.mjs --check|--write`.

## Project invariants

- Edit `shortcuts-data/` and `public/data/key-codes.json`; never the gitignored generated output (`public/data/{combined-apps.json,macos,windows,linux}`, `public/schema/`, `public/optimized/`).
- Edit shared shortcut logic in `shared/shortcuts-core`, then run `sync-shortcuts-core.mjs --write`. `src/lib/shortcut-core` (site) and `src/shortcut-core` (Raycast) are generated copies, checked in CI.
- Changing the section, key, title or comment of an existing catalog row, or removing it, orphans saved favorites/overlays for it; do it only to fix real errors.
- The Raycast extension fetches `data/<platform>/apps.json`, `data/<platform>/<slug>.json`, `data/key-codes.json` and icons from `https://hotkys.com` (or the `dev:catalog` override), so generated-format changes affect the published extension.
- The site is a static export using `@clerk/react` client APIs only: no middleware, server-side auth, server actions or `@clerk/nextjs`. `sitemap.ts`, `robots.ts` and `opengraph-image` are static metadata routes. Where installed skills suggest `@clerk/nextjs` server patterns or `auth.uid()`-based RLS, these conventions take precedence.
- Supabase is only the database, via `@supabase/supabase-js`. The site passes the Clerk session token through the client's `accessToken` callback (`src/lib/supabase/client.ts`); Raycast uses Clerk OAuth PKCE (`src/auth`, `src/user-data`).
- RLS authorizes by `profiles.clerk_user_id = auth.jwt()->>'sub'`, not `auth.uid()`. Website requests use `authenticated`; Raycast OAuth tokens arrive as `anon` with narrower, issuer-checked policies. Add schema changes as a new migration and update `schema.sql` to match; run `test:rls`.
- User-content limits live in both client validation (`src/lib/validation`, `src/lib/services`) and database constraints; change them together.

## Configuration and secrets

- Public catalog development needs no env file. For accounts, copy `shortcuts-disco-site/.env.local.example` to `.env.local` with a designated test environment. Only `NEXT_PUBLIC_*` values belong there; never use server/secret keys or point test Clerk at production Supabase.
- `NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING` stays off until the rollout in `docs/auth-operations.md` is complete.
- Raycast's public Clerk OAuth client and Supabase publishable key are checked in at `src/auth/config.ts`.
- Production migrations, dashboard changes, deployment and store release need explicit authorization.

## CI and deployment

- PR workflows: the site job checks the shared-core sync, validates catalog data and formatting, then runs tests, type check, lint, build and `test:rls`. The extension job runs sync check, tests, type check, lint and build on macOS and Windows.
- `deploy-pages.yml` deploys to GitHub Pages on pushes to `main` touching the site, `shared/` or `scripts/`, after `check:config -- --mode production --database` (requires a `pk_live_` Clerk key). `src/lib/services/deploy-pages-workflow.spec.ts` asserts workflow properties; update it with the workflows.
- The Raycast extension is published to the Raycast Store manually; `build`/`publish` reject an active catalog override.

## Delivery

Use `type(scope): summary` commit messages. The scope is optional; scopes in use include `site`, `raycast`, `catalog`, `auth`, `ui`, `platform` and `deps`. PRs use `.github/PULL_REQUEST_TEMPLATE.md`.
