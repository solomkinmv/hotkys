# Project remediation verification

Implementation date: September 7, 2026 (America/Toronto; final checks continued on September 8 UTC). Baseline: `6a79eab`. Verified implementation revision: `bae6443` on retained branch `codex/project-remediation`. The subsequent verification-only commit adds this report.

## Local implementation

| Scope | Delivered |
| --- | --- |
| T01–T02: build foundation and shared contracts | Real type/lint/build gates; generated shared grammar, identity, favorite and overlay rules; consumer fixtures; standalone Raycast packaging |
| T03–T06: private state and database | Session-bound requests and shared account snapshots; serialized preferences and owned credential mutations; stored favorite IDs and stable private references; explicit clearing readers; quota-safe edits; additive ownership and authoring-integrity migrations |
| T07–T08: client behavior | Explicit desktop/browser execution targets, whole-sequence validation, awaited errors/timeouts and focus checks; stable keyboard navigation, memoized search, extracted controls, visible private-load failures and reduced-motion styling |
| T09–T10: contribution lifecycle | Editable metadata/platforms/sections/rows, reorder/delete, allowlisted export and clipboard failure feedback; schema validation; non-mutating catalog generation with stale-output cleanup and real watcher coverage |
| T11–T13: maintenance and operations | Removed unused UI modules/dependency; local licensed social-card fonts; contribution templates and catalog-identity gate; development catalog override; public/test/production configuration checks and auth runbook |
| T14: acceptance and release preparation | Local checks below; hosted identity, native OS behavior, production migration/deployment and store rollout remain pending |

The final favorite regression fix keeps versioned identities readable after conflicting catalog entries are removed, and uses the shared matcher in the website's pinned-favorites section. Ambiguous historic Windows Command/Control IDs are not guessed; see the recovery policy in [auth operations](../auth-operations.md#ambiguous-legacy-shortcut-identities).

## Executed checks

Final runtime: Node `22.16.0` on macOS. Clean `npm ci` installs also completed on the host's Node `26.3.0`; no lockfile update was required during final verification.

| Check | Result |
| --- | --- |
| Website Jest, final full suite (`npm test -- --runInBand --coverage=false`) | 30 suites, **266 tests passed** |
| Raycast Jest, final full suite with coverage | 17 suites, **130 tests passed** |
| Website type check and lint | Passed |
| Raycast type check, metadata/icon lint, formatting and build | Passed |
| Standalone extension copy, without repository siblings | Fresh install, types and build passed; final source copied and rebuilt successfully |
| Shared generated source/fixture equality | Passed |
| Public catalog identity comparison against `6a79eab` | No existing public references changed |
| Website catalog schema and formatting | Passed |
| Real watcher and export round trip | Passed for desktop/web exports through both consumers and add/change/delete/schema/key-code events |
| RLS/schema/migration suite | **71 checks passed**, zero skipped |
| Real PostgreSQL last-slot race | Passed with two independent connections against disposable localhost database `hotkys_test`; one insert accepted and one rejected, final count 25 |
| Deliberate type-error gate probes in isolated copies | Both packages' type checks and builds rejected the probe; probes removed afterward |
| Final static website build | Passed, 272 generated pages; no missing/dynamic font warnings |

A coverage-instrumented website run passed 263 tests before the final three favorite regressions were added. The final 266-test run disables coverage to avoid repeating the expensive instrumentation; production coverage inclusion rules remain enabled in CI. The multi-mutation authoring regression has a 15-second timeout after exceeding the old 5-second budget under host load. No behavior assertions were removed.

The catalog round trip starts with desktop and web private fixtures, exports allowlisted JSON, generates public files, then parses them through both actual consumer adapters. It verifies literal-plus/multi-chord identities and platforms, then watches add/change/delete/schema/key-code changes. Polling is used for reliable filesystem notifications, including temporary-directory and mounted filesystem workflows.

Database tests cover fresh-schema and upgraded legacy fixtures, anonymous/website/OAuth ownership, cross-account references, quota edits, clear-field constraints, ordering, and cascades. These tests use local claim fixtures and do not establish hosted JWT verification.

Logs and disposable fixtures are outside Git under `/tmp/hotkys-*`; visual artifacts are outside the checkout. They are local diagnostic artifacts, not durable CI links. No screenshot or private account data is committed.

## Browser acceptance

Public development preview was exercised through the browser: catalog search, empty search, keyboard link activation to Safari, list/cheat-sheet views, a 390 px viewport without horizontal overflow, and the `/my-shortcuts?app=sample` login return URL. The public-only sign-in page displays the unavailable-auth state rather than a broken provider form. Component regressions cover private authoring mutations, retry states, favorite aliases/renames, and clipboard denial.

The final static export contains all 160 catalog app/keymap routes. Ten HTTP probes (public/private/login routes plus schema/catalog manifests) returned 200. Browser verification of the final export confirmed Safari's cheat sheet at desktop and 390 px width (`scrollWidth === innerWidth === 390`), plus `/my-shortcuts?app=custom-tools` preserving the complete query in the sign-in return URL. The exported public-only login page shows its unavailable-auth message. The generated Safari social card was visually inspected: Command/Control/Option/Shift/Tab symbols render without missing glyphs.

Screenshots are retained outside Git at `/Users/max/.codex/visualizations/2026/09/07/01a07e02-de15-7e62-9fbc-fb2e2ef284e2/final-safari-desktop.png` and `final-safari-mobile.png`.

## Outstanding acceptance and rollout

1. **Hosted identity:** a designated test Clerk/Supabase environment and two test accounts are required for Google, email-link/cross-device completion, Raycast PKCE cancel/reconnect, real token verification, and live A/B own/other-user permission checks. No test environment or test users were provisioned in this implementation task.
2. **Native Raycast:** execute the harmless target/permission matrix in [the implementation plan](../plans/2026-09-07-project-remediation-plan.md#t14--integrate-perform-acceptance-and-stage-release). Unit tests inspect generated scripts and awaited process outcomes; actual closed-app launch, Accessibility/Automation denial, browser host change, delay, focus change and partial-sequence behavior remain unverified in the running development extension. An installed native Raycast instance was detected, but the full native acceptance matrix was not executed.
3. **External native logout overlap:** in-command Disconnect serializes this extension's owned token writes/removal. Native token-store removal is checked before persistence, but the API provides no shared transaction with an external/native logout occurring during an already-started credential write. Do not claim that overlap is proven safe from the mocked refresh tests; verify it natively before release.
4. **Database release:** inspect existing drafts for duplicate section/keymap titles before the integrity migration. Apply the three additive migrations to the authorized target and verify constraints/policies. Local PostgreSQL and PGlite tests do not mean production migrations were applied.
5. **Compatible readers and website rollout:** release and verify the compatible Raycast reader first; only then enable `NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING`. The flag remains off by default. Production deployment, store publication and live route verification were not performed.

The exact setup and acceptance steps are in [auth operations](../auth-operations.md); the contributor workflow is in [CONTRIBUTING](../../CONTRIBUTING.md). The implementation worktree is retained for review. The original checkout is unchanged apart from the two planning documents created before implementation.
