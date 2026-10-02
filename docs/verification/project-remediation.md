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

## Account data follow-up — October 1, 2026

The three additive migrations were applied to the production project after duplicate-title, platform and parent-ownership preflight checks passed. A private backup was saved outside Git. Migration history matches the repository versions, and comparison before/after verified that every existing field and row in the four affected content tables was preserved.

The new zero-row production API check failed against the old schema and passed after migration. A transaction on the live PostgreSQL database verified website/OAuth favorite writes, stable references and cascades, customization writes, clearing constraints, reorder permissions, cross-account denial and anonymous denial; all test fixtures were rolled back. RLS remains enabled on all seven private tables. These SQL claim fixtures verify database permissions, not Clerk token issuance or hosted JWT verification.

Local verification passed: website 274 tests, Raycast 131 tests, 71 database checks, both package type/lint/build checks, generated-core synchronization and the existing catalog-identity guard. Added regressions cover sign-out rejection without session changes, successful sign-out, late rejection after account switching, favorite reconciliation without replay, deployment schema failures and Raycast cleanup on final view closure. Astra independently reviewed the remediation and found no actionable defects.

The website changes are prepared for review; no website deployment or Raycast store publication was performed, and the overlay-clearing flag was not enabled. The discarded private-keymap routing and partial-loading hypotheses do not justify implementation changes; the public identity compatibility guard remains in place.

## Real Clerk and native Raycast acceptance — October 1, 2026

Real Google sign-in through Clerk succeeded on `hotkys.com` for an existing account. Its saved favorites loaded; a temporary Safari app favorite persisted after reload. The current development extension then completed native PKCE authentication through `accounts.hotkys.com`, Clerk consent and the Raycast callback. Native Favorites included the same Safari favorite. Removing it in Raycast changed the website back to Add to favorites after reload. The final production favorite count returned to its original nine rows; existing favorites were left intact.

The native Apply smoke test exposed a command-lifecycle bug: `closeMainWindow` used `PopToRootType.Immediate`, unloading the command before `runShortcuts` could start. Keeping the command suspended until the awaited runner finishes, then popping to root, repaired it. Failure retains the view and existing error feedback for manual retry. Chrome's harmless Jump to Address Bar (`Command+L`) executed successfully through the actual development command; the address was visibly selected. Temporary diagnostic logging was removed. [Raycast's lifecycle documentation](https://developers.raycast.com/information/lifecycle) confirms that popping to root unloads a view command.

Raycast's native Settings Logout control removed the OAuth connection. Reopening Favorites required sign-in and displayed no saved private data. Website Sign Out also succeeded, and `/favorites` then displayed its sign-in state. The development account and website test session were left signed out. This normal logout check does not prove a token-refresh/write overlap safe.

The website test used the deployed frontend (`4a4a571`) with the migrated production database; it does not verify the pending website auth-wrapper change in production. Native acceptance used this branch's development extension (`9b710bc` plus the lifecycle fix), not the store build. Astra reviewed the lifecycle repair. After the fix, all 134 Raycast tests, type checking, lint and build passed; three new regressions cover deferred execution, failure without replay, and invalid input keeping the list open.

Screenshots remain outside Git under `/Users/max/.codex/visualizations/2026/10/02/01a0fa30-2aa1-7d70-b114-44b70a1fa978/`: `clerk-favorite-persisted.jpg`, `raycast-favorites-synced.png`, `raycast-native-execution.png`, `raycast-private-data-after-logout.png` and `clerk-logged-out.jpg`. No credentials, authorization parameters or private account identifiers are committed.

## Outstanding acceptance and rollout

1. **Hosted identity:** Google sign-in, native PKCE, hosted token verification through real favorite reads/writes, and normal logout passed for one existing account above. Email-link/cross-device completion, PKCE cancel/reconnect and live A/B own/other-user checks still require designated test accounts. No test environment or test users were provisioned.
2. **Native Raycast:** harmless `Command+L` execution passed after the lifecycle repair. The broader target/permission matrix in [the implementation plan](../plans/2026-09-07-project-remediation-plan.md#t14--integrate-perform-acceptance-and-stage-release) remains pending: closed-app launch, Accessibility/Automation denial, browser host change, delay, focus change and partial-sequence behavior were not exercised.
3. **External native logout overlap:** normal Settings Logout and private-view reopening passed. In-command Disconnect serializes this extension's owned token writes/removal. Native token-store removal is checked before persistence, but the API provides no shared transaction with an external/native logout occurring during an already-started credential write. The overlap remains unverified.
4. **Database release:** completed for production in the October 1 follow-up above. Other environments must still inspect their drafts and migration ledger before applying the upgrades.
5. **Compatible readers and website rollout:** release and verify the compatible Raycast reader first; only then enable `NEXT_PUBLIC_ENABLE_OVERLAY_CLEARING`. The flag remains off by default. Production deployment, store publication and live route verification were not performed.

The exact setup and acceptance steps are in [auth operations](../auth-operations.md); the contributor workflow is in [CONTRIBUTING](../../CONTRIBUTING.md). The implementation worktree is retained for review. The original checkout is unchanged apart from the two planning documents created before implementation.
