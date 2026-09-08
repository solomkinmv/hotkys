# Hotkys reliability and contribution specification

Status: proposed, ready for implementation planning. Baseline: `main` at `6a79eab`, audited September 7, 2026. Companion: [implementation plan](2026-09-07-project-remediation-plan.md).

## Outcome

People can browse the public catalog without signing in, maintain private shortcuts on the website, use the same shortcuts and favorites in Raycast, and turn a selected private app into a valid, reviewable public contribution. Account changes never expose another account's data. Applying a shortcut never knowingly targets a different application. A green pull request verifies both consumers and the generated catalog.

This work covers the website, Clerk/Supabase integration and setup, Raycast, database compatibility, authoring/export, repository contribution tooling, CI, and the cleanup identified by the audit. This repository has no Expo or iOS app. The Apple-specific acceptance work is macOS Raycast focus, execution, permissions, and OAuth lifecycle testing.

## Baseline and evidence corrections

- Both builds, TypeScript checks, website and extension tests, and 60 isolated database permission cases passed during the audit. Passing these checks did not cover the reproduced behavioral defects below.
- Reproduced: stale account responses, lost favorite identifiers, plus-key parsing, cleared overlay fields restoring defaults, empty-list keyboard navigation producing NaN, wrong-target runner control flow, and quota rejection of an existing-row upsert.
- Exported CSS lacks the animation utilities referenced by UI components. The generated Safari social card visibly has missing keyboard glyphs; the successful build logged font download failures.
- **A11 is refined:** Raycast's PKCE API automatically provides an extension logout preference. The missing capability is discoverable account context within commands and correct cache/request invalidation, including native logout. This is not evidence that users cannot log out at all. [Raycast OAuth documentation](https://developers.raycast.com/api-reference/oauth)
- GitHub resolves both the old `solomkinmv/shortcuts-disco` remote and `solomkinmv/hotkys` to the canonical repository `https://github.com/solomkinmv/hotkys`. Do not report the repository alias as a broken URL; repair inconsistent destinations and stale anchors.
- Current source already contains restricted Raycast OAuth policies and refresh handling that preserves credentials on transient errors. Preserve these protections. Live Clerk/Supabase settings and native logout behavior have not been verified.

## Scope and constraints

Keep Next.js static export, GitHub Pages, Clerk React authentication, Supabase data access, and Raycast PKCE. Keep the four existing Raycast commands and their public browsing behavior. Keep independent install/build/publish flows for the website and extension.

Do not introduce a custom auth server, GitHub OAuth integration, automatic issue/PR submission, a queue of offline private writes, billing, collaboration, or an Expo/iOS target. An export remains private until the user deliberately publishes it on GitHub. This specification does not authorize production configuration changes or publication; it defines the implementation and release procedure.

## Design decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Shared behavior | One small, framework-free shortcut core; check in generated copies inside each consumer | Removes proven domain drift while allowing Raycast's published directory to build independently |
| Packaging | Canonical source in `shared/shortcuts-core/`; a Node script copies it into each app with a generated header and verifies equality | Avoids a registry release, root workspace migration, or a published extension depending on sibling folders |
| Website state | One account-scoped resource provider, with focused hooks over it | Makes identity changes, errors, invalidation, and preference serialization consistent without introducing a general-purpose caching framework |
| Raycast state | Secure PKCE storage stays authoritative; command-local private resources are scoped to account/session generation | Fits Raycast lifecycle without persisting another copy of private data |
| Identity | Use saved row IDs for deleting favorites; retain full resource identifiers for adding/matching | Avoids reconstructing a lossy query from labels |
| Overlay clearing | Add explicit `key_is_cleared` and `comment_is_cleared` booleans, default false | Preserves existing null-as-inherit behavior and database nonempty-string constraints |
| Contribution | Download/copy validated JSON and open the canonical contribution guide; offer issue reporting separately | Matches what a static site can actually do, without implying a PR was created |
| Generator | One validated generation pipeline used by build, watch, and contribution checks | The website and Raycast must see the same source snapshot |

Considered alternatives: a published shared npm package adds release coordination; independently maintained domain implementations with fixtures detect but do not remove drift. The generated-copy approach is limited to pure domain files, with no app-specific UI, auth, filesystem access, or services in the shared core. Generated files are never edited by hand. Do not expand this into a generic code-generation framework.

## Requirements

### AUTH — Identity, setup, and authorization

**AUTH-01: Session-bound requests.** Every private read or mutation captures an account identity, Clerk session identity where available, and a monotonically increasing local generation. Tokens and profile IDs used by one operation must belong to that captured identity. A mutable global token provider must not silently bind an old user's pending payload to a new session.

Before dispatch, reject an operation whose session has changed. After completion, only the matching generation may update UI, cache, errors, loading indicators, or optimistic state. On identity change, immediately replace private state with the new identity's unloaded state. Cleanup/abort is an optimization; the generation check is the correctness boundary. An already dispatched operation may finish for its original account; do not claim client cancellation rolls back a database commit.

**AUTH-02: Resource state.** Profiles, preferences, favorites, and customizations expose `loading`, `ready`, and `error` distinctly. Signed-out and unconfigured states are separate. A failed read must not become “no shortcuts” or “app not found.” Retry is visible and scoped to the failed resource. A failed private-data sync must leave the public catalog usable and identifiable as unsynced.

**AUTH-03: Mutation behavior.** Preserve edits on failure, show actionable feedback, and prevent duplicate submission. Serialize preference patches per account, coalesce rapid changes where appropriate, and merge each patch against the latest confirmed/pending state. On failure, roll back only that operation's optimistic change or retain an explicitly unsaved value; never undo a newer successful edit. No cross-device last-write arbitration or offline mutation queue is added here.

**AUTH-04: Logout and switching.** Show connected-account context and an account action in Raycast without adding a fifth command. Use supported native preferences/logout behavior where sufficient; an in-command disconnect action must use the same token store. Detect removal/replacement of credentials before accepting pending refresh results or private resource results. Never restore credentials after logout. Reopening a command after native logout must not reveal stale data or trigger authorization just to browse the catalog. Account switching is an explicit authorization flow. Locally disconnecting does not promise immediate revocation of already-issued JWTs.

**AUTH-05: Preserve least privilege.**

| Actor | Allowed | Denied |
| --- | --- | --- |
| Signed-out visitor | Public static catalog and contribution docs | All private database rows |
| Website Clerk session | Own profile creation/update, preferences, favorites, private app/keymap/section/shortcut authoring | Other users' rows and privileged database operations |
| Raycast Clerk OAuth token | Own profile read/lazy creation, customization reads, favorite read/add/delete | Profile update, preferences, and customization writes |

Ownership must be enforced in the database, including nested parent ownership and new favorite foreign keys. Keep OAuth issuer binding. Verify the actual token formats, role mapping, and documented audience/client claims before changing policy predicates; decoding a JWT in the extension is not verification. Do not grant broader roles to make an integration test pass. [Supabase Clerk integration](https://supabase.com/docs/guides/auth/third-party/clerk)

**AUTH-06: Reproducible setup.** Replace historical “completed” checkboxes in `USER-ACCOUNTS-SETUP.md` with a current runbook, environment matrix, verification steps, and dated evidence when actually checked. Document:

- Public-only local development with no credentials; authenticated development using an explicitly designated non-production database and Clerk environment; production website and extension configuration.
- Google and email-link sign-in, allowed application origins/redirects, Clerk third-party integration, website session role, Raycast public OAuth client, PKCE callback, requested scopes, JWT access-token format, refresh behavior, and Supabase policies.
- Public/publishable keys and OAuth client IDs are public configuration, not secrets. No service-role key, Clerk backend secret, OAuth client secret, or raw token enters either bundle, tracked docs, CI logs, or fixtures.
- Production deploy validates the expected issuer/project/key combination, not just presence. The extension build validates its public config against the documented production environment. Local overrides must not appear as unsafe end-user token/secret preferences.
- Fresh-database bootstrap versus ordered upgrade migrations. Verify schema equivalence; do not treat rerunning a schema snapshot as an unreviewed production migration strategy.

The existing cross-device email-link preference is an intentional documented product choice; preserve it unless separately changed. Provisioning a new hosted environment is not part of creating this spec. Record the selected test environment before authenticated acceptance work. [Clerk OAuth overview](https://clerk.com/docs/guides/configure/auth-strategies/oauth/overview)

### DATA — Parsing, references, and database compatibility

**DATA-01: One grammar.** Normalization, validation, official catalog parsing, private overlays, export, and Raycast execution consume the shared parser. Its pure result uses symbolic modifiers and base keys; macOS JXA strings belong in the execution adapter. Accept plus keys and sequences consistently. Canonicalize documented aliases without dropping unknown tokens. Display/comment-only entries remain valid and non-executable. Enforce platform eligibility independently from key-code availability.

**DATA-02: Preserve existing identities.** Freeze existing `base_shortcut_id` derivation and legacy fallback behavior while extracting code. Changing internal modifier representation must not rewrite saved identities. Maintain golden compatibility fixtures, including duplicate titles and occurrence indexes. Where fixing the old plus parser changes a derived identity, provide an explicit deterministic compatibility mapping; never attach saved data to an ambiguous same-title shortcut.

Catalog changes can also change content-derived identities. Contribution checks must report changes to existing keys/titles/comments and the affected identity compatibility. An identity-changing contribution requires an explicit migration/alias decision before merge. Unresolvable legacy references must be surfaced with a recovery option, not silently matched or deleted. A wholesale catalog-ID rewrite is outside this remediation.

**DATA-03: Favorites.** Additions retain full official/custom identity. Deletion accepts the persisted favorite row ID plus account scope and is idempotent. An already-present addition returns the canonical row after a uniqueness conflict. Use custom app IDs to resolve current names/routes after rename. Add nullable custom shortcut/keymap references only where required to preserve favorites through authoring edits; backfill only unambiguous legacy matches and preserve unresolved rows visibly. Test same-title rows, renamed resources, legacy references, and repeated clicks across both clients.

**DATA-04: Overlay semantics.** For each of `key` and `comment`:

| Stored state | Result |
| --- | --- |
| `*_is_cleared = true`, value null | Explicitly empty: no sequence or no comment |
| `*_is_cleared = false`, value non-null | Replacement value |
| `*_is_cleared = false`, value null | Inherit the official value |

Defaults preserve old rows. A clear flag with a non-null value is invalid. Editing supports clear and restore-original actions; the user sees the effective result before saving. A visible, nondeleted entry must still have a key or meaningful comment after merging. Separate overlay validation from standalone shortcut validation.

**DATA-05: Quotas and parent operations.** Existing overlay edits use an ownership-scoped update by persisted row ID; new overlays use an insert with deterministic uniqueness-race recovery. Reaching a creation quota never blocks editing/deleting an existing row. Database quota enforcement remains atomic for actual creation. Do not solve this by removing quotas or using privileged clients. Test true concurrent inserts in PostgreSQL in addition to local PGlite cases. Parent deletion must clean up owned dependent references; failed saves must not leave invisible partial containers.

### WEB — Website behavior and components

**WEB-01:** All website account hooks use AUTH state and feedback rules. Resource changes invalidate every relevant consumer; refetching one mounted hook cannot leave another view stale. Preserve public browsing while authentication initializes or fails.

**WEB-02:** One route helper resolves official apps/keymaps and private app IDs. Official routes remain generated at build time. Private routes remain query-based under `/my-shortcuts`; missing or deleted references get a useful recovery state. Favorites, search results, editor navigation, and post-login redirects use the same helper. No Next middleware/server session requirement is added to this static export. [Next.js static export](https://nextjs.org/docs/app/guides/static-exports)

**WEB-03:** Keyboard selection stays finite and within range as search/filter results change. Empty lists are safe; Escape resets selection; events inside unrelated inputs, dialogs, buttons, selects, or editable content are not hijacked. Focus and selection are distinct. Enter and pointer activation use the same Next navigation behavior. Search inputs have accessible names and platform-appropriate shortcut hints.

**WEB-04:** Extract the shortcut editor, list/cheatsheet row presentation, and view controls from AppDetails. Reuse parsing/formatting and customization decisions; keep layout-specific presentation local. Use stable refs and memoize the Fuse index on the searchable data. Keep current routes, view modes, and favorites affordances.

**WEB-05:** Reuse form labels, validation messages, mutation states, and confirmation dialogs. Make selected settings perceivable with toggle/radio/tab semantics rather than color alone. Recover from clipboard denial. Dialogs and menus use compiled Tailwind 4 animation utilities and honor reduced motion. This is consistency work, not a redesign.

**WEB-06:** Bundle fonts used by social-card generation, with appropriate license files and coverage for every keyboard glyph. Fail clearly on missing assets; no runtime font fallback network dependency should silently replace keys with boxes. Verify representative desktop/web/multi-platform cards. Keep visual evidence outside Git. Ordinary unoptimized Next images are allowed for the static export; fix actual missing alt text and layout/accessibility issues rather than blindly replacing every img.

### RAY — Raycast execution and synchronization

**RAY-01: Explicit execution target.** Carry an execution target separately from catalog metadata. List All Shortcuts may launch/activate a known desktop bundle, then confirm it is foreground. Current App captures the actual app. Current Web captures the browser bundle and matched hostname; a web app's optional desktop bundle must not steal focus. Before sending keys, re-check the intended browser/page. If a browser/page cannot be identified or revalidated, show the shortcut but disable Apply with a reason. Choosing a web app from the all-app list must not send keys to an arbitrary previous app.

**RAY-02: Execution contract.** Validate the entire sequence and a finite, nonnegative delay before closing the window. Default blank delay to zero; retain the preference's documented unit in seconds. Bound total execution time and report timeout. Apply the delay after restoring the intended target, including browser flows. Recheck focus before emission; if focus changes between chords, stop remaining chords and report partial execution without pretending to undo emitted keys. A small unavoidable OS focus race is a runtime limitation, not an absolute delivery guarantee.

Use an awaited process/official utility with surfaced permission and script errors. Avoid shell interpolation of bundle IDs. Do not show success before process completion. Loading or failed key-code data has a visible disabled/retry state. Comment-only, unsupported-modifier, invalid-key, and ineligible-platform entries cannot execute. A failed multi-chord sequence is never silently replayed.

**RAY-03: Private sync.** Reuse one account-scoped snapshot per command and revalidate after a favorite mutation. Preserve public catalog usefulness during private sync errors; show sync status instead of conflating failure with no custom apps. Respect AUTH-04 for native logout, reconnect, and pending refresh. No interactive authorization on optional public/background reads. Keep refreshed-token fallback and transient-error behavior already covered by tests.

### CONTRIB — Authoring through reviewed publication

**CONTRIB-01: Complete private authoring.** Create and edit app name/slug, bundle ID, hostname, source URL, and icon location; edit keymap title/platforms, section title/order, and shortcut title/keys/comment/order. Existing entries can be corrected and removed, not only appended. Use simple move up/down ordering; drag-and-drop is unnecessary. Apply stable identifiers and duplicate-name/route rules, account-scoped mutations, quotas, and consistent destructive confirmations. Do not discard an unsaved app draft when a child save refetches the app.

**CONTRIB-02: Draft versus publishable.** Private drafts may temporarily have empty keymaps or sections, but saved populated rows must satisfy field validation. A contribution requires complete nonempty structure, canonical shortcut syntax, valid platforms and resource locations, and catalog-level uniqueness. Return precise app/keymap/section/shortcut error locations. Export failure preserves the draft and points to the field needing correction.

**CONTRIB-03: Honest export.** Export the selected custom app only, using an allowlist of public `InputApp` fields. Exclude profile/email, user/database IDs, favorites, timestamps, tokens, and other private apps. Preview JSON and the contribution summary before download/copy. Explain that sharing publishes the selected content. Clipboard failure leaves download available. Use ordinary public JSON, not account-overlay internals.

The primary handoff opens `CONTRIBUTING.md` and gives fork/add-file/PR steps. An explicitly separate action opens an issue template for users who want maintainer help. Neither action claims a PR exists. Avoid putting an entire private export in a URL. Supporting existing-app corrections uses the documented repository-file/PR flow; building a second overlay-to-PR authoring system is not required.

**CONTRIB-04: Source validation.** A non-mutating command validates JSON schema plus domain semantics for the full catalog. Check filename/slug agreement, unique slugs and bundle IDs, nonempty/unique serialized keymap route names, legal platform arrays, supported keys, safe icon/source locations, and reserved output names/prefixes. In particular, catalog slugs must not collide with `apps.json`, `combined-apps.json`, `key-codes.json`, or the private-route `custom-` convention. Validate local icon paths against the repository public directory without requiring every external source website to be online in PR CI.

Declare validator dependencies directly (`ajv` is currently imported through a transitive dependency). Keep contributor examples and JSON schema aligned with the runtime parser. Formatting is an explicit command with a check mode and optional selected files; watching/building must not rewrite contributors' source files.

**CONTRIB-05: Deterministic generation.** The same validated snapshot generates combined data, platform manifests, platform app files, and the published JSON schema. Add/change/delete/rename, platform removal, and key-code/schema edits all trigger appropriate regeneration in watch mode. Generated data cannot retain removed apps or old slugs. Stage results before publishing; validation/write failure keeps the last complete usable snapshot. Delete only pipeline-owned generated files, preserving tracked key codes and unrelated assets. Tests use temporary directories.

**CONTRIB-06: Review and delivery.** Add contribution documentation and concise PR/issue templates with source, app/version/platform, tested shortcuts, file path, and validation commands. Run one exported fixture through website preview, platform generation, Raycast parsing, and exact expected identities/keys. Provide a development-only catalog-origin override so the development extension can preview locally generated data instead of silently fetching production. All catalog/key-code/icon requests use that origin; production defaults to `https://hotkys.com` and release validation rejects a local origin. Source changes that affect a consumer trigger its CI. After approved publication, verify the deployed catalog payload and affected website route and Raycast behavior; a merge or successful upload alone is not proof of delivery.

### QUALITY — Maintenance and validation

Remove unused Card/Table/Command modules, useWindowDimensions, cmdk if still unused, dead exports, obsolete comments, and generated Jest-template noise after checking references. Do not delete public/framework entrypoints or infer removal solely from coverage. Use shared code for proven behavior, not a new generic repository/service abstraction.

Tests must exercise observable behavior: account switching, errors, persisted favorite IDs, grammar round trips, quota conflicts, contribution artifacts, and runner targets. Configure coverage to include production sources and show untested areas. Retain useful structural checks but replace schema-string claims with executable database tests for behavioral guarantees. Do not impose an arbitrary global coverage percentage or create tests for boilerplate removal.

## Audit traceability

| Audit | Requirement | Plan tasks |
| --- | --- | --- |
| A01 Account-state exposure | AUTH-01–03, WEB-01 | T03, T04 |
| A02 Wrong-target execution/errors | RAY-01–02 | T07 |
| A03 Favorite identity loss | DATA-02–03 | T02, T05 |
| A04 Invalid custom routes | WEB-02, DATA-03 | T05 |
| A05 Plus-key parsing | DATA-01–02 | T02 |
| A06 Cannot clear overlay fields | DATA-04 | T06 |
| A07 Keyboard NaN/global handlers | WEB-03 | T08 |
| A08 Failed loads/settings feedback | AUTH-02–03, WEB-01 | T03, T04, T08 |
| A09 Quota blocks existing edits | DATA-05 | T06 |
| A10 CI omits builds/lint | QUALITY, CONTRIB-06 | T01, T12 |
| A11 Native logout refinement | AUTH-04, RAY-03 | T04 |
| A12 Platform filtering | DATA-01, RAY-02 | T02, T07 |
| A13 Missing animation utilities | WEB-05 | T08 |
| A14 Missing social-card glyphs | WEB-06 | T11 |
| Dead code, duplication, components | QUALITY, WEB-04–05 | T02, T08, T11 |
| Auth setup and deployed assurance | AUTH-05–06 | T01, T06, T13, T14 |
| Full contribution flow | CONTRIB-01–06 | T09, T10, T12, T14 |

## Acceptance and release boundaries

| Scenario | Expected evidence |
| --- | --- |
| Account A read/save completes after B login or logout | No stale state, error, loading change, or credential resurrection; no old payload sent with B's token |
| Google/email link login and Raycast authorization | Real test-account success, redirect preservation, exact environment and timestamp; cross-device email behavior verified |
| Website/Raycast authorization separation | Live own/other-user reads and allowed/denied writes match AUTH-05; issuer/token-verification failures rejected |
| Favorites round trip and rename | One persisted favorite; remove deletes that row; current route resolves; duplicate titles remain distinct |
| Clear/restore overlay fields at quota | Both updated clients show the same effective shortcut; existing-row edits work at limit, new rows fail |
| macOS permissions/focus/target | Recorded manual matrix for allowed/denied permission, closed app, switched focus, browser hostname, delay, sequence failure |
| Contribution from a blank draft | Metadata and rows editable; private fields absent from export; valid PR artifact passes both consumers |
| Catalog generation changes | Add/change/delete/rename/platform/schema/key-code tests produce consistent manifests; no source mutation or stale files |
| Website UI and exports | Keyboard, labels, dialog feedback, animation CSS/reduced motion, clipboard denial, symbol coverage checked |
| Fresh clone/package isolation | Both packages install/build with lockfiles; extension builds from its directory alone; CI runs the advertised checks |

Release in additive order: contract/read compatibility and database migration first; updated Raycast next; website write features last. Keep clear-field authoring disabled behind an explicit default-off public build setting until the updated extension is available. Older extension versions cannot interpret new clear flags; state this limitation and prompt/document updating rather than claiming universal compatibility. Do not remove legacy columns, aliases, or rows in this release.

Roll back UI/execution changes independently. Leave additive database columns in place; avoid reversing a migration by deleting user data. Keep an observable list of unresolved legacy favorite/overlay references and repair only deterministic cases. Track implementation, local verification, native/live acceptance, deployment, and store availability separately; completion requires all applicable rows above, with explicit remaining evidence rather than a blanket “all fixed.”
