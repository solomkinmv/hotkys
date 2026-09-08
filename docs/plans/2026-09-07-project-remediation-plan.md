# Hotkys Reliability and Contribution Implementation Plan

> **For the implementer:** use the installed `executing-plans` skill as adaptable task-by-task guidance. Follow the dependency order and acceptance requirements below. This document is a plan, not evidence that the changes or production rollout have happened.

**Goal:** resolve the audit's correctness and maintenance findings and deliver a coherent website → private authoring → contribution → public catalog → Raycast workflow.

**Architecture:** retain the static Next.js website, Supabase database, Clerk session/OAuth authentication, and independently publishable Raycast extension. Extract a small pure shortcut core with verified generated consumer copies; isolate private state by session; evolve database contracts additively; unify validation and catalog generation.

**Tech Stack:** TypeScript, Next.js 16/React 19, Tailwind 4/Radix, Clerk React, Supabase/PostgreSQL, Raycast API/utils, Jest/Testing Library, PGlite, Node scripts, GitHub Actions.

**Specification:** [remediation spec](2026-09-07-project-remediation-spec.md). Baseline: local `main`, `6a79eab`, September 7, 2026.

---

## Working rules and sequence

All paths below are relative to `/Users/max/projects/personal/shortcuts-disco`; run commands from that root unless indicated. Verify the selected checkout before editing. For implementation, use a retained branch/worktree such as `codex/project-remediation`; do not disturb other worktrees. The planning documents themselves were created in the current checkout.

Keep PRs reviewable by grouping the tasks below, not by making one giant cleanup commit. A commit message is suggested for each task; this plan does not require pushing, merging, changing a hosted dashboard, or publishing to a store while implementing locally. No artificial approval pause is needed between routine authorized implementation steps.

| Delivery slice | Tasks | Dependency/exit condition |
| --- | --- | --- |
| 1. Regression and build foundation | T01, T02 | Accurate CI plus compatible shared grammar |
| 2. Account and database correctness | T03–T06 | Safe resource state, favorites, additive contracts, quota edits |
| 3. Client behavior | T07, T08 | Safe Raycast target handling and consistent website interactions |
| 4. Contribution lifecycle | T09, T10 | Complete drafts, validated export, coherent generated catalog |
| 5. Maintenance and release evidence | T11–T14 | Visual/build cleanup, contribution CI, setup runbook, live acceptance |

T07's target safety can be implemented early after T01, before shared-core integration, if the P1 fix should ship independently. T11 can follow T08 without waiting for contribution authoring. Do not enable new clear-field writes until the compatibility rollout in T14 permits it.

For behavior changes: add the smallest meaningful failing regression, verify the intended failure, implement the correction, then run the targeted checks. Do not write tests for commented-template cleanup or merely reproduce an implementation's internal structure.

## T01 — Establish executable build and regression gates

**Covers:** A10, QUALITY, AUTH-06 foundations.

**Modify:**

- `shortcuts-disco-site/package.json`, `shortcuts-disco-site/jest.config.ts`
- `shortcuts-raycast-extension/package.json`, `shortcuts-raycast-extension/jest.config.ts`
- `.github/workflows/build-site-pr.yml`, `.github/workflows/build-extension-pr.yml`
- `shortcuts-disco-site/src/lib/services/deploy-pages-workflow.spec.ts` where current workflow assumptions change

**Steps:**

1. Record actual HEAD, clean/dirty status, Node version, existing script results, and the known social-card font warnings. Preserve user changes.
2. Add `test:types` as `tsc --noEmit` in both packages. If a clean site requires generated types/data, express that prerequisite in the script; do not rely on a previous local build.
3. Make the site PR job run tests, RLS tests, type checking, lint, and static build. Build public pages without production credentials; test configured/unconfigured auth through fixtures. Keep production deploy config validation separate.
4. Make the extension PR job run tests, type checking, lint/metadata validation, and build. Use a supported macOS job for Raycast-specific tooling if Linux cannot execute it; do not label tests as a build.
5. Set coverage source globs so absent hook/runner tests are visible. Exclude generated artifacts explicitly rather than hiding authored production files. Remove the obsolete Jest comment template.
6. Verify both workflows on a fresh checkout with `npm ci`. Check scripts actually fail for a temporary type/build error in an isolated copy, then discard the probe.

**Commands after adding scripts:** `npm --prefix shortcuts-disco-site run test:types`; `npm --prefix shortcuts-raycast-extension run test:types`. Use the full command matrix in T14 once for the integration checkpoint.

**Done when:** PRs cannot pass solely on Jest while build/types/lint fail; catalog-only contributors need no private credentials. Existing unrelated warnings are recorded separately until T11.

**Suggested commit:** `ci: verify builds types and lint before merge`.

## T02 — Consolidate shortcut grammar and preserve identity compatibility

**Covers:** A05, A12 domain rules, duplicated domain logic, DATA-01–02.

**Create:**

- `shared/shortcuts-core/{types,parser,identity,platforms,favorites,overlay}.ts`
- `shared/shortcuts-core/fixtures/{grammar,identities,overlays,favorites}.json`
- `scripts/sync-shortcuts-core.mjs`
- Generated `shortcuts-disco-site/src/lib/shortcut-core/` and `shortcuts-raycast-extension/src/shortcut-core/`, including fixture copies used by package-local tests
- `shortcuts-disco-site/src/lib/services/shortcut-contract.spec.ts`
- `shortcuts-raycast-extension/src/user-data/shortcut-contract.spec.ts`

**Modify:** both input parsers, both shortcut mergers, both shortcut-identity modules, modifier adapters, website `shortcut-key-format.ts`, `custom-shortcut-validation.ts`, `validator.ts`, and each package's model imports.

**Steps:**

1. Freeze expected identities from the current implementation for ordinary keys, duplicate labels/occurrences, legacy overlays, custom favorites, and renamed display labels. Add failing plus-key and unsupported-modifier cases.
2. Implement pure token-based grammar and platform eligibility. Test `+`, `cmd++`, multi-chord sequences, aliases, duplicate modifiers, unknown modifiers, unknown keys, comment-only rows, and whitespace. Do not silently turn invalid input into a different executable shortcut.
3. Move identity/favorite/overlay semantics into pure functions, preserving legacy wire IDs through explicit adapters for existing modifier strings. Add deterministic aliases only for proven old-parser differences; ambiguous references remain unresolved.
4. Implement a dependency-free sync script: `--write` copies canonical source/fixtures with a generated header; `--check` exits nonzero on missing, extra, or changed managed files. Limit operations to declared generated directories.
5. Replace authored duplicate algorithms with thin framework/model adapters. Keep auth, UI, filesystem, JXA strings, and process execution out of the core. Add explicit generated provenance to prevent future hand edits.
6. Run the same contract fixtures against both consumers. Copy the extension directory into a temporary location without the repository siblings; install and build it there to prove publishing independence.

**Commands:** `node scripts/sync-shortcuts-core.mjs --write`; `node scripts/sync-shortcuts-core.mjs --check`; targeted Jest on `shortcut-contract`, `input-parser`, `shortcut-merger`, `favorites`, and `custom-shortcut-validation` in each relevant package.

**Done when:** both clients produce identical semantic output for the fixtures; saved IDs remain compatible; the standalone extension build needs no sibling import or local `file:` package dependency.

**Suggested commit:** `refactor: share shortcut contracts across clients`.

## T03 — Isolate website private resources by session

**Covers:** A01, A08, AUTH-01–03, WEB-01.

**Create:**

- `shortcuts-disco-site/src/lib/auth/session-scope.ts`
- `shortcuts-disco-site/src/components/auth/account-data-provider.tsx`
- `shortcuts-disco-site/src/components/auth/account-data-provider.spec.tsx`
- `shortcuts-disco-site/src/lib/hooks/use-preferences.spec.tsx`

**Modify:** `auth-provider.tsx`, `app/layout.tsx`, `lib/auth/session.ts`, `lib/supabase/client.ts`, `services/current-profile.ts`, `user-service.ts`, `customizations-service.ts`, `favorites-service.ts`, and hooks `use-customizations.ts`, `use-favorites.tsx`, `use-preferences.ts`, `use-profile.ts`, `use-merged-shortcuts.ts`.

**Steps:**

1. Add deferred-promise tests for A → B, A → signed out, same-user session replacement, late failure, unmount, and a mutation paused before resolving its token/profile. Assert no A payload is dispatched with B credentials.
2. Introduce an explicit session scope with identity, generation, and token acquisition bound to that session. Replace reliance on the mutable global client/token bridge in private operations.
3. Own resource snapshots in one provider. Reset immediately on scope change and invalidate outstanding work. Use cancellation where supported plus generation checks before every state commit.
4. Adapt existing hooks to provider selectors/actions. Deduplicate concurrent loads for the same resource; mutation success invalidates all affected consumers.
5. Add explicit errors and retry actions. Preserve public data during private sync failure. Remove “not found”/empty results caused merely by failed loads.
6. Serialize/coalesce preference patches without overwriting newer fields. Test failures and reversed response ordering, plus sign-out while a patch is pending.

**Commands:** targeted website Jest for `account-data-provider`, `use-preferences`, `current-profile`, `use-platform-filter`, and existing account-dependent page tests; `npm --prefix shortcuts-disco-site run test:types`.

**Done when:** the audit's stale-response reproduction fails against the old hook and passes against the new provider, including token/profile binding and late errors. A settings write failure is visible and recoverable.

**Suggested commit:** `fix: isolate website data and mutations by session`.

## T04 — Make Raycast account lifecycle and sync state explicit

**Covers:** refined A11, A08 extension behavior, AUTH-04, RAY-03.

**Create:** `shortcuts-raycast-extension/src/view/account-actions.tsx`, `src/load/user-data-provider.spec.tsx`, and session lifecycle regression cases in `src/auth/session-manager.spec.ts`.

**Modify:** `src/auth/{session,session-manager,token-exchange}.ts`, `src/load/{user-data-provider,apps-provider,app-shortcuts-provider}.ts`, `src/user-data/{service,supabase-client}.ts`, `src/view/{apps-list,shortcuts-list}.tsx`, and Raycast README.

**Steps:**

1. Inspect the installed Raycast OAuth API and actual native logout preference. Test tokens removed/replaced while refresh or authorization is pending; a finished operation must not restore a removed session.
2. Expose account context and a discoverable account/settings action in existing command views. Reuse native logout behavior where sufficient; use the same PKCE store for any in-command disconnect.
3. Add generation/token-store checks around refresh persistence and private-data completion. Ensure credentials, profile lookups, and request headers are bound to the same session.
4. Share one private snapshot per command, remove redundant full-account reads, and invalidate after favorite changes. Check secure credentials on command activation/reopen and before private mutations.
5. Keep catalog browsing usable during offline/private sync failures; expose retry/sync state. Preserve the existing `invalid_grant` versus transient-error distinction. Add timeouts without discarding valid credentials on a timeout.
6. Verify explicit reconnect/account switching, cancelled authorization, native logout, and background reads that must not open auth UI.

**Commands:** targeted extension Jest for `session-manager`, `token-exchange`, `user-data-provider`, and `service`; extension types/build/lint.

**Done when:** native or in-command logout removes private state, pending work cannot restore it, and browsing public shortcuts does not require a login. Do not claim immediate server-side JWT revocation.

**Suggested commit:** `fix: synchronize Raycast account lifecycle and private data`.

## T05 — Repair favorites, stable custom references, and navigation

**Covers:** A03–04, DATA-03, WEB-02. Depends on T02 and session scopes from T03/T04.

**Create:** `shortcuts-disco-site/src/lib/navigation/shortcut-routes.ts` and its spec; `shortcuts-disco-site/src/lib/services/favorites-service.spec.ts`; one additive migration via the Supabase CLI if custom reference columns are required.

**Modify:** both favorites services/models/mappers, website `use-favorites.tsx`, `favorite-button.tsx`, `favorites-content.tsx`, `application-list.tsx`, custom app navigation, extension `view/favorite-action.tsx`, `user-data/favorites.ts`, schema and RLS tests.

**Steps:**

1. Add round-trip tests: website add → Raycast remove and reverse; same-title shortcuts; custom app/shortcut rename; legacy title-based favorite; repeated delete; simultaneous add.
2. Change remove actions to send persisted favorite ID and session scope. Keep the full identifier for add/match; return the existing canonical row on duplicate insertion. Make errors and per-item pending states visible.
3. Add stable custom shortcut/keymap references only where needed for authoring rename/delete support. Create migration using `supabase migration new stable_custom_favorite_references` after checking CLI help; use its generated filename. Add ownership predicates for the referenced resource and update both schema and migration tests.
4. Backfill only uniquely identifiable legacy rows; retain ambiguous/missing references with a visible recovery state. Do not bulk-delete old favorites or guess among duplicate titles.
5. Centralize official/custom route resolution. Resolve custom app IDs to current slugs and route to `/my-shortcuts?app=...`; preserve keymap/section context only if the editor actually supports it. Missing targets must not become broken static links.
6. Test database deletion cleanup and actual exported-route existence for official targets. Preserve legacy URL entry points where feasible.

**Commands:** both favorite/service/mapper tests; website navigation/component tests; `npm --prefix shortcuts-disco-site run test:rls` after adding FK/policy cases.

**Done when:** one click removes the selected stored favorite rather than creating another; renames resolve by stable ID; cross-user references remain denied.

**Suggested commit:** `fix: preserve favorite identity and custom navigation`.

## T06 — Add explicit overlay clearing and quota-safe edits

**Covers:** A06, A09, DATA-04–05, AUTH-05. Depends on T02 and T03.

**Create:** a CLI-generated migration named `explicit_overlay_clearing`; `shortcuts-disco-site/supabase/tests/overlay-quota.test.mjs`; focused service tests in `src/lib/services/customizations-service.spec.ts`.

**Modify:** `supabase/schema.sql`, both models/mappers/mergers and shared overlay contracts, website `customizations-service.ts`, `custom-shortcut-validation.ts`, AppDetails shortcut editor, and migration test harness.

**Steps:**

1. Reproduce clearing key/comment and the 2,000-row upsert failure as executable regressions. Add edit-at-quota and new-row-at-quota cases before changing behavior.
2. Generate the migration with `supabase migration new explicit_overlay_clearing`; add default-false clear flags and consistency constraints. Verify old rows remain semantically identical.
3. Implement the spec's inherit/replace/clear resolver in the shared core and both mappers. Support restore-original. Validate the effective merged entry rather than requiring every overlay to be a standalone catalog shortcut.
4. Update known existing overlays by persisted row ID with ownership scope. Insert only genuinely new overlays. On a creation race, re-read the exact identity and update only if it is unambiguous; bound the retry. Keep database quotas on actual inserts.
5. Extend PGlite tests for fresh schema and upgraded legacy data, clear-field constraints, uniqueness races, quota edits, and permissions. Add a real PostgreSQL concurrency test for simultaneous last-slot creation using an explicit local/test database; do not infer concurrent behavior from SQL-string tests.
6. Add reader compatibility before exposing clear-field writes. Add a default-off `NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING` build setting and document its release condition. Record that old extension versions ignore the new flags and coordinate the release as in T14.

**Commands:** targeted merger/validation/service tests in both packages; `npm --prefix shortcuts-disco-site run test:rls`, extended to include the new Node test file. A new `test:db:concurrency` script must fail clearly when its designated test database is unavailable.

**Done when:** existing edits and deletions work at the quota; new creation remains bounded; both updated clients agree on clear/restore semantics and all least-privilege tests still pass.

**Suggested commit:** `fix: support explicit overlay clearing and quota-safe edits`.

## T07 — Make shortcut execution target-aware and observable

**Covers:** A02, A12, RAY-01–02. Depends on T02 for final integration; the P1 target fix may land earlier.

**Create:** `shortcuts-raycast-extension/src/engine/{execution-target,shortcut-runner}.spec.ts`; `src/engine/execution-target.ts`.

**Modify:** `src/engine/{shortcut-runner,frontmost-hostname-fetcher}.ts*`, `src/{app-shortcuts,web-shortcuts}.tsx`, `src/view/{apps-list,shortcuts-list}.tsx`, custom platform filtering in loaders/core adapters, delay descriptions in `package.json` if clarification is needed.

**Steps:**

1. Capture generated-script/process behavior in mocks: requested app absent, activation fails, focus changes, wrong browser hostname, invalid delay, missing key codes, unsupported modifier, permission failure, timeout, and partial sequence failure. No actual OS input in unit tests.
2. Define an explicit target union for desktop bundle versus captured browser/page. Carry it through command navigation. Never infer the target only from an app catalog row.
3. Validate the whole sequence first. Filter custom keymaps with the same platform contract as official data; never drop `win` and execute the remaining key. Disable Apply for invalid/non-executable rows or unresolved targets.
4. Launch/activate a known desktop target if needed; restore and revalidate browser/page targets. Apply validated delay in both flows. Check focus immediately before sending keys and between chords; abort remaining work if it changes.
5. Replace detached fire-and-forget execution with an awaited subprocess or supported Raycast utility. Pass bundle IDs as data, enforce a bounded timeout, surface permission/activation errors, and avoid automatic replay.
6. Run the native acceptance subset in T14 with harmless actions in disposable documents. Record expected target, observed focus, permission state, configured delay, and result. Do not mark native safety proven by mocks alone.

**Commands:** targeted extension runner/target/platform tests; extension build and lint. Native checks run from the development extension, not by issuing unattended raw keystrokes from CI.

**Done when:** absent/wrong targets receive no keys in tests; actual macOS target/permission flows pass; users can distinguish failure from success.

**Suggested commit:** `fix: validate Raycast targets and report execution failures`.

## T08 — Repair website keyboard behavior and component contracts

**Covers:** A07, A08 UI, A13, WEB-03–05, AppDetails/component duplication.

**Create:** `src/lib/hooks/use-keyboard-navigation.spec.tsx`, `src/components/shortcuts/{shortcut-editor-dialog,shortcut-row,shortcut-view-controls}.tsx`, and focused component tests under the website package.

**Modify:** AppDetails, `search-bar.tsx`, `settings-content.tsx`, custom authoring/error UI, `globals.css`, dialog/sheet/popover/dropdown primitives, and website `package.json` if a compatible animation dependency adjustment is necessary.

**Steps:**

1. Add observable tests for empty search → arrow → restored results, changed result length, Escape, Enter navigation, editable/dialog targets, and accessible search names.
2. Keep selection finite/in range; route via Next router; scope listeners and use stable refs. Render the correct search shortcut hint for the platform.
3. Extract common row/editor behavior from AppDetails with current behavior covered. Memoize searchable data/index; do not change unrelated layout or content.
4. Standardize field labels, validation, pending/disabled states, retry output, and destructive dialogs. Use pressed/selected semantics for settings and tabs. Preserve form drafts across refetches and failed mutations.
5. Register supported Tailwind 4 animation utilities or replace their references with explicit CSS. Verify compiled selectors exist. Implement reduced-motion behavior without disabling useful focus feedback.
6. Inspect narrow/wide layouts, keyboard-only navigation, dialogs, and empty/error states in the browser. Save screenshots outside the repository. Do not claim a comprehensive accessibility audit from a few component tests.

**Commands:** targeted website keyboard/AppDetails/settings tests, website types/lint/build; generated CSS assertion for the specific motion utilities.

**Done when:** keyboard and pointer navigation agree, no empty-list NaN, error feedback is actionable, and shared components have consistent behavior and compiled motion.

**Suggested commit:** `fix: unify website shortcut interactions and feedback`.

## T09 — Complete private authoring and contribution export

**Covers:** CONTRIB-01–03. Depends on T03, T05, T06, and reusable editor work in T08.

**Create:** `shortcuts-disco-site/src/components/shortcuts/export-dialog.spec.tsx`; focused authoring service tests and exported-artifact privacy fixtures.

**Modify:** `app/my-shortcuts/{my-shortcuts-content,my-shortcut-app-content}.tsx` and tests, `components/shortcuts/export-dialog.tsx`, `services/{customizations-service,custom-shortcut-validation,export-service}.ts`, validation models/schema, shared form/editor pieces.

**Steps:**

1. Add failing user-flow tests for hostname/source/platform editing, correcting/removing an existing shortcut, renaming a section/keymap, simple reordering, and unsaved app metadata surviving a child-save refetch.
2. Add missing update/delete service methods with session scope and ownership. Preserve stable references; handle parent cascades and validation conflicts visibly. Add database uniqueness/platform constraints where necessary via a CLI-generated `authoring_structure_integrity` migration, first reporting existing collisions and resolving only deterministic cases. Test failed parent/child creation so any retained incomplete container remains visible as a draft. Use move controls rather than introducing drag-and-drop.
3. Support empty draft containers while validating populated rows. Export validates complete structure and reports precise field locations, preserving the draft on failure.
4. Build JSON from an allowlist of public fields. Test that user/profile IDs, emails, tokens, favorites, timestamps, overlay flags, and other apps never appear. Existing-app changes use the documented repo contribution route rather than exporting private overlay internals.
5. Rename the handoff consistently: copy/download JSON, contribution summary, and open contribution guide. Keep a separate explicitly labeled issue-reporting action. Provide actionable clipboard failure and download fallback; clean up timers/object URLs on lifecycle changes.
6. Run an end-to-end local authoring/export scenario using a desktop fixture and a web fixture. Compare exported semantic content with what the updated website and Raycast display.

**Commands:** website authoring/export/service tests; types/lint. Use fixtures for privacy assertions, not real account data in snapshots.

**Done when:** users can create and correct a contribution entirely in the authoring UI; the export is valid, scoped, and accurately described; no automatic GitHub submission occurs.

**Suggested commit:** `feat: complete shortcut authoring and contribution handoff`.

## T10 — Unify validation, generation, and development watching

**Covers:** CONTRIB-04–05, grammar/docs consistency, stale generated platform data.

**Create:**

- `shortcuts-disco-site/src/lib/write/catalog-pipeline.ts` and `.spec.ts`
- `shortcuts-disco-site/src/lib/load/catalog-validation.ts` and `.spec.ts`
- `shortcuts-disco-site/src/lib/write/validate-data.ts`
- `shortcuts-disco-site/src/lib/write/watcher.spec.ts`

**Modify:** `app-loader.ts`, `validator.ts`, `write/{app-writer,watcher,prettify}.ts`, schema validation tests, `shortcuts-data/schema/shortcut.schema.json`, website `package.json`/lockfile, and runtime scripts currently importing `__tests__/helpers`.

**Steps:**

1. Add temporary-directory tests for add/change/delete/rename, changed platform eligibility, key-code/schema change, stale generated files, invalid input, failed writes, and preservation of tracked key codes.
2. Add direct `ajv` dependency at a version compatible with the chosen schema validation setup; explicitly configure formats/draft support rather than relying on transitive packages. Validate the complete catalog before publishing generated artifacts.
3. Enforce source filename/slug equality, duplicates, serialized route collisions/empty paths, reserved artifact names/private prefixes, field limits, platform arrays, grammar, and local icon paths. Keep remote-site availability outside deterministic CI.
4. Implement a pure snapshot-to-output stage and a narrowly scoped writer. Publish only a fully validated staged generation; reconcile obsolete owned outputs. Publish the JSON schema at its declared public URL. Sort filesystem/catalog metadata deterministically while preserving deliberate section/shortcut order.
5. Route export-data and watcher changes through the same pipeline, including platform files. Watch key codes and schema as well as app files. Remove implicit source prettifying and the fragile self-write lock; make formatting explicit with check/write modes and selected-file support.
6. Extract production key-code loading from test helpers. Add actionable path-specific diagnostics. Verify the ordinary dev command starts correctly and cleans up its watcher on exit; fix shell background-process handling if needed.

**New scripts:** `validate-data`, `format-data:check`; extend `prettify` with documented explicit writes, and keep `export-data` as the one generation entry point.

**Commands:** `npm --prefix shortcuts-disco-site run validate-data`; `npm --prefix shortcuts-disco-site run format-data:check`; `npm --prefix shortcuts-disco-site run export-data`; targeted pipeline/watcher/schema tests. Repeat generation in a temp directory and assert identical outputs.

**Done when:** changes visible in website combined data are also visible in Raycast platform data; removed artifacts disappear; invalid input never replaces the last usable generation; no build/watch command rewrites source JSON.

**Suggested commit:** `fix: validate and regenerate all shortcut catalog outputs`.

## T11 — Finish dead-code, presentation, and font cleanup

**Covers:** A14, QUALITY, remaining WEB-04–06.

**Modify/remove after rechecking usage:** website `useWindowDimensions.ts`, UI `card.tsx`, `table.tsx`, `command.tsx`, `cmdk`, unused `exportMultipleApps`, obsolete imports/comments, and replaced authored domain implementations. Keep useful account actions and framework entrypoints.

**Modify/create:** `app/apps/[slug]/[keymap]/opengraph-image.tsx`, a narrowly scoped shared display-format helper if still needed, and licensed local font assets under `shortcuts-disco-site/src/assets/fonts/` with their license files.

**Steps:**

1. Recheck imports/entrypoints after refactoring; remove only still-unused code and dependencies. Preserve the supported public command/schema interfaces.
2. Remove misleading boilerplate and type assertions made unnecessary by explicit models; leave comments explaining compatibility and non-obvious constraints.
3. Select fonts with all rendered keyboard glyphs, store assets and license files locally, and replace remote font fetching. Fail on missing/corrupt assets rather than accepting an error body as font bytes.
4. Build representative Safari, developer-tool, web-app, and Windows/Linux social cards. Visually inspect every distinct modifier/base symbol used and record images outside Git.
5. Resolve actual lint/accessibility warnings and document intentional static-export image handling. Verify no unexpected bundle growth; report measured changes only if measured.

**Commands:** website lint/types/build and relevant formatter/OG tests; both builds after removing shared/dependency code. No new tests for deleting comments or unused wrappers.

**Done when:** the four unused modules/dependency path are gone or have justified consumers, OG cards have no missing glyphs or font-network fallback errors, and package builds remain independent.

**Suggested commit:** `refactor: remove unused UI and stabilize social card assets`.

## T12 — Make the repository contribution path executable

**Covers:** CONTRIB-06, final A10 path coverage, DATA-02 catalog-change checks.

**Create:** `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/shortcut-contribution.yml`, `shortcuts-raycast-extension/src/config/catalog.ts` and tests, and a contract/generation verification script only if existing commands cannot express the check clearly.

**Modify:** root/website/Raycast READMEs, export links, both PR workflow path filters, deploy workflow prerequisites, package scripts, existing schema/data tests, extension catalog/key-code loaders, and icon URL construction.

**Steps:**

1. Document clean-clone install, selected-file formatting, non-mutating validation, local website preview, local Raycast data preview, source/icon provenance, export placement, and fork/add-file/PR steps. Implement and verify a development-only catalog-origin override using the installed Raycast development tooling; keep its default at `https://hotkys.com`, use it consistently for catalog/key-code/icon requests, and reject local origins in release validation. Do not add a production end-user server preference. Explain source JSON versus generated data and avoid stale anchors/repository names.
2. Add concise PR and issue templates. Ask for tested app/version/platform and source without requiring screenshots, tokens, or private account exports in every contribution.
3. Add a catalog diff check against the PR base for changes that affect existing derived shortcut identities. Report affected references and require a deliberate compatibility/migration decision; do not automatically remap ambiguous rows.
4. Extend CI triggers to shared core, contract fixtures, catalog/schema/key-code changes, scripts, and applicable workflow files. Relevant contribution changes must exercise both consumers; schema/migration changes must exercise permissions and upgrades.
5. Run generated-core equality, full catalog validation, formatting check, generation, and consumer contract fixtures. Ensure a fork PR works without secrets. Check the published extension directory contains its generated core and fixtures.
6. Put an exported fixture into a temporary catalog and pass it through validation → generation → website parser → Raycast parser. Assert exact expected keys, platforms, counts, and compatible identities, not just file existence.

**Commands:** `node scripts/sync-shortcuts-core.mjs --check`; website validation/format/generation scripts; both contract suites; GitHub PR workflow run against a real reviewable branch when publication is authorized.

**Done when:** a first-time contributor can follow the guide from JSON to a locally verified PR artifact, and data changes cannot bypass either consumer's compatibility gate.

**Suggested commit:** `docs: make shortcut contributions verifiable end to end`.

## T13 — Replace auth setup history with a verified operations runbook

**Covers:** AUTH-05–06, migration and deploy configuration assurance.

**Create:** `docs/auth-operations.md`; website `src/lib/auth/config-validation.ts` and tests; extension `src/auth/config.spec.ts`; a Node-compatible configuration-check entry point used by CI/deploy.

**Modify:** `USER-ACCOUNTS-SETUP.md`, `.env.local.example`, website Clerk/Supabase config, extension public auth config, `.github/workflows/deploy-pages.yml`, database migration test bootstrap, and package scripts.

**Steps:**

1. Inventory configured values by name and environment without printing secrets. Document public-only, development/test, production website, and production extension modes. Mark dashboard settings as unverified until checked.
2. Document fresh schema setup and ordered upgrades, including how to compare resulting policies/constraints/triggers. Do not apply migrations to a production database as part of a documentation task.
3. Implement checks for missing/contradictory public configuration and wrong environment combinations. Permit no-auth public development; fail configured account features coherently if only half the integration is present. Keep production issuer/project expectations explicit.
4. Document Google/email-link flows, the accepted cross-device link setting, website Clerk role/session behavior, Raycast public-client PKCE callback/scopes/JWT token mode, trusted issuer, and native logout. Verify claimed token fields before adding any audience/client restriction to RLS.
5. Add a token-redacted diagnostic checklist: HTTP status, expected operation, environment, migration version, timestamp, safe claim names/values where needed. Never log full access/refresh/ID tokens or provider credentials.
6. Define authenticated acceptance instructions using two dedicated test users in a designated test environment. Record required operator inputs if that environment or account access is unavailable; continue all independent local work.

**Commands:** newly added `check:config` scripts in explicit public/test/production modes; config/unit tests; schema-versus-upgrade RLS suite. Validate CLI commands against installed `--help` before documenting exact migration application commands.

**Done when:** a new maintainer can set up the actual architecture without stale “already done” assumptions, and production builds reject mismatched public config without exposing credentials.

**Suggested commit:** `docs: define auth configuration and migration verification`.

## T14 — Integrate, perform acceptance, and stage release

**Covers:** all requirements and the spec's acceptance table. Depends on applicable earlier tasks.

**Create:** `docs/verification/project-remediation.md` containing only redacted results, exact revisions, dates, and outstanding evidence. Store screenshots, logs containing account context, and disposable fixtures outside Git.

**Steps:**

1. Run the full local command matrix below after the final integrated changes. Distinguish existing failures from introduced failures. Do not broaden testing beyond the affected packages/services without a concrete concern.
2. Verify no-auth website browsing and direct static routes; keyboard/filter/view modes; reduced motion; custom/private routes and login redirect restoration. Verify public browsing during auth/database failure.
3. With dedicated test accounts, test Google, email links including the accepted cross-device flow, Raycast authorization/cancel/reconnect, native logout, refresh during logout, A/B switching, and private reads/writes under the AUTH-05 permission matrix. PGlite claim mocks are not proof of hosted JWT verification.
4. Perform Raycast target acceptance in disposable apps/documents: closed target launch, wrong/no target, unsupported browser, browser URL change, denied/regranted Accessibility/Automation, blank/invalid/configured delay, missing key data, multi-chord success, focus change and partial failure. Avoid destructive shortcuts and automatic retries.
5. Author desktop/web contribution fixtures, edit metadata/platforms/rows, export, validate, generate, and preview both clients. Verify favorites survive supported renames and no private account fields enter output. Exercise catalog deletion/rename locally.
6. Prepare additive migrations and inspect resulting constraints/policies. For an authorized rollout, apply/read-verify database changes, release compatible Raycast readers and confirm store availability, then enable website clear-field writes. Keep an independently reversible UI rollout; retain legacy data/aliases.
7. After an authorized website deployment, verify the actual affected route, schema endpoint, manifests/app payloads, and running extension revision. Record remaining store/dashboard/native blockers precisely; do not equate local green checks with production completion.

### Local command matrix

These commands assume the scripts introduced by T01/T06/T10/T13 have been implemented. `npm ci` is needed for fresh installs or lockfile changes; targeted tests are used during individual tasks.

```bash
node scripts/sync-shortcuts-core.mjs --check
npm --prefix shortcuts-disco-site ci
npm --prefix shortcuts-disco-site run validate-data
npm --prefix shortcuts-disco-site run format-data:check
npm --prefix shortcuts-disco-site test -- --runInBand
npm --prefix shortcuts-disco-site run test:rls
npm --prefix shortcuts-disco-site run test:types
npm --prefix shortcuts-disco-site run lint
npm --prefix shortcuts-disco-site run build
npm --prefix shortcuts-raycast-extension ci
npm --prefix shortcuts-raycast-extension test -- --runInBand
npm --prefix shortcuts-raycast-extension run test:types
npm --prefix shortcuts-raycast-extension run lint
npm --prefix shortcuts-raycast-extension run build
```

Run `test:db:concurrency` only against the explicitly configured local/test PostgreSQL instance. Repeat the standalone extension directory build from T02 if packaging/core generation changed. Configuration smoke commands must name their environment and must not infer production credentials from a developer shell.

**Done when:** each applicable acceptance row is backed by evidence, generated assets and both clients agree, and local versus deployed versus store verification is clearly distinguished. If publication is outside the active implementation request, leave a concrete tested release package and list the still-unperformed rollout steps.

**Suggested commit:** `test: record remediation acceptance and release evidence`.

## Risk and rollback notes

- The two P1 fixes should not wait for cosmetic cleanup. Keep their behavior regressions independently runnable.
- Preserve content-derived identity compatibility when changing parsers or catalog data. No guessed same-title migrations and no silent deletion of unresolved references.
- Database evolution is additive. Keep old-reader limitations explicit; new clear flags require updated clients. Roll back authoring/UI behavior rather than dropping populated columns.
- Native OAuth logout is provided by Raycast. Verify it before creating redundant account controls; lifecycle/cache correctness remains required.
- Browser-target verification cannot be replaced by an arbitrary frontmost-window assumption. It is acceptable to leave Apply unavailable when target certainty is absent while keeping display/search available.
- Authoring is intentionally expanded to correction and metadata editing, but automatic GitHub publication, shared accounts, bulk private-data export, and a separate backend remain out of scope.
- The shared core's generated copies are a packaging boundary, not permission to duplicate business logic by hand. Equality checks and independent package builds must remain in CI.

## Planning completion checklist

- Every A01–A14 finding maps to requirements and tasks, with A11 corrected against framework behavior.
- Website, auth setup, Raycast, contribution authoring/export, catalog tooling, database rollout, and dead-code cleanup have concrete file targets and acceptance checks.
- Unknown hosted/native behavior is an explicit verification task, not an assumed implementation defect or a reason to block local planning.
- Production actions remain separate from creating these documents; no implementation or rollout is claimed by this plan.
