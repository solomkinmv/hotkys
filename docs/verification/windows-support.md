# Windows support integration

PR: https://github.com/solomkinmv/hotkys/pull/131

The original Windows branch predated the shared parser, personal account data, catalog pipeline, and verified execution-target contract. This integration merges current main and preserves those behaviors.

## Gaps fixed

- Manifest declares both `macOS` and `Windows`; all four existing commands remain.
- A Raycast `windowsAppId` (which may be an AppUserModelID) is not interpreted as an executable. Catalog `windowsProcessName` is a separate field. Capture uses the native executable path or a unique installed-app match. Missing identifiers never match each other.
- Both catalog manifests and app files preserve Windows metadata. Both consumers retain it through parsing and base-app customization. The shared contract copies are generated together.
- Seed process mappings for Chrome, VS Code, Android Studio, current Teams, Slack, Sublime Text, GitHub Desktop, and Zoom; installed-app resolution covers additional catalogue/private apps where Raycast supplies an executable path.
- Apply dispatches to the platform runner, validates the whole sequence, and waits for completion before unloading the command. Mac-only `cmd` bindings are displayed as `Cmd` and rejected by Windows execution rather than reinterpreted as Ctrl.
- Win32 `SendInput` supports Ctrl/Alt/Shift/Win, function/navigation keys, and punctuation resolved using the target thread's keyboard layout. Unknown keys are rejected; they are never typed as text. Existing held modifiers cancel execution. Partial injection is reported without retries.
- Native execution verifies window/process ownership, waits for activation, and checks focus immediately before each chord. Multiple open windows require an unambiguous target; missing applications are not launched by the Windows runner.
- Browser capture uses the native browser's window root rather than `FocusedElement`, captures process/window/URL, and rechecks the address before each chord. Supported process families: Chrome/Chromium, Edge, Brave, Vivaldi, Opera, Firefox. An absent or ambiguous address bar cancels capture. Unsupported browsers/pages remain unavailable.
- Scripts use encoded JSON and a guarded PowerShell block which exits on failure. This matters because Raycast's PowerShell utility feeds stdin commands that otherwise could continue after a failed top-level statement.
- Private app lists filter keymaps for the active platform. Existing favorites, overlays, identities, and account flows remain shared with macOS.
- Extension CI runs tests, types, lint, and build on macOS and Windows. Windows-only tests execute actual PowerShell, compile Win32/UIA helpers, check the INPUT ABI and keyboard layout mapping, reject missing/mismatched windows and unverifiable URLs, and verify error propagation over stdin.

## Custom app identifiers

Custom app details support optional `windowsAppId` and `windowsProcessName` alongside the macOS bundle ID. Use the Windows ID returned by Raycast or an executable name without `.exe` (for example, `Code`). These fields sync with the account and are preserved in exports, so a custom display name such as “My Editor” can target Visual Studio Code.

“Copy Current App's ID” copies the Windows app ID when available. Otherwise it copies a resolvable executable process name and labels it in the confirmation. Apps with neither identifier remain unavailable for execution.

If a custom app and a public catalog entry match the same Windows application, “List Current Shortcuts” offers a choice of shortcut collections. Selecting a collection keeps the detected native process as the execution target.

Apply `shortcuts-disco-site/supabase/migrations/20261003203001_custom_app_windows_identifiers.sql` before deploying the website changes. Existing rows keep null Windows identifiers. Database checks and the shared runtime validator reject executable paths, `.exe` suffixes, control characters, and unsupported process names; account access policies remain in effect.

Verify creating, editing, clearing, exporting, and reloading both fields, then select a renamed custom app in Windows Raycast and apply a harmless shortcut in its intended app. Identifier integration tests and native keyboard tests cover separate parts of this flow; interactive Raycast acceptance is still required.

## Catalog corrections and saved references

Separate Windows keymaps for Linear, Gmail, and Atom use explicit Windows Ctrl bindings. Gmail’s inherited incorrect plus/g bindings are corrected to hyphen/q in both Mac and Windows keymaps. VS Code and Proto.io Windows rows are corrected against their official references. Xcode and kitty are excluded from Windows catalogs. The sixteen changed/removed public shortcut references are fingerprinted in `docs/catalog-compatibility.json`: affected favorites/overlays are not guessed or migrated; users can recreate them against corrected rows. Original Mac keymaps remain, with the same two Gmail corrections.

Whole-Windows-catalog tests parse every supported app and validate every declared nonempty binding, including the legacy `plus`, `hyphen`, and standalone modifier key aliases.

## Verification and boundaries

Run from the extension: `npm ci`, `npm test -- --runInBand --coverage=false`, `npm run test:types`, `npm run lint`, `npm run build`.
Run from the site: `npm ci`, `npm test -- --runInBand --coverage=false`, `npm run test:types`, `npm run lint`, `npm run validate-data`, `npm run format-data:check`, `npm run test:catalog`, `npm run build`.
Run from the repository: `node scripts/sync-shortcuts-core.mjs --check`, `node scripts/check-catalog-identities.mjs origin/main`.

Local development host is macOS. Windows native tests are intentionally skipped there and run on Windows CI. Native helper tests do not prove full Raycast command interaction, browser UI Automation across every version/language, signed-in Windows OAuth, or successful injection into vendor applications. These require an interactive Windows acceptance pass before publishing. No production publication, deployment, database change, or merge is performed by this integration.

## Interactive Windows acceptance

1. Install/import the extension in Raycast for Windows. Test all four commands with public catalog access and no account credentials.
2. Open one VS Code, Chrome, or Sublime window. Current Shortcuts should choose its Windows keymap. All Shortcuts should show its Windows process identity and the same shortcuts. Copy Current App's ID should copy the native Windows application identifier.
3. Apply a harmless binding (e.g. Ctrl+A in a scratch document), a sequence (Ctrl+K Ctrl+S in VS Code), and punctuation (Ctrl++). Confirm the intended action, no lingering modifiers, and completed command navigation. Test Win+Left in a disposable window.
4. Change focus during a 5-second delay. Close the target. Open multiple target windows. Confirm cancellation without input to another app. Elevated targets should fail from non-elevated Raycast without automatic retries.
5. Open a supported browser at a catalog site (e.g. Gmail or Linear). List Current Web Shortcuts should resolve its hostname. Change tab/path/query during a delay; confirm Apply stops. Try unsupported schemes, browsers, missing address bars, and localized browser UI.
6. Connect/disconnect an account, load private Windows/macOS keymaps, favorite and overlay a base Windows shortcut, and switch accounts. Confirm platform filtering, stable favorite identity, and no stale private data.

## Primary research

- [Raycast manifest platforms](https://developers.raycast.com/information/manifest)
- [Raycast Application fields](https://developers.raycast.com/api-reference/utilities#application)
- [Raycast PowerShell utility](https://developers.raycast.com/utilities/functions/runpowershellscript)
- [SendInput and integrity levels](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput)
- [Foreground activation restrictions](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow)
- [VS Code executable](https://code.visualstudio.com/docs/setup/portable)
- [Chrome executable](https://support.google.com/chrome/answer/142063?hl=en)
- [Android Studio installer source](https://github.com/JetBrains/android/blob/master/native/installer/win/setup_android_studio.nsi)
- [Teams executable](https://learn.microsoft.com/en-us/microsoftteams/teams-client-deployment-checklist)
- [Slack executable](https://slack.com/help/articles/360035198374-Troubleshoot-Slack-in-a-Citrix-environment)
- [Sublime executable](https://www.sublimetext.com/3)
- [GitHub Desktop project execution evidence](https://github.com/desktop/desktop/issues/3882)
- [Zoom executable](https://explore.zoom.us/media/zoom-video-communications-certification-report.pdf)

- [Windows VS Code shortcuts](https://code.visualstudio.com/docs/reference/default-keybindings)
- [Proto.io platform bindings](https://support.proto.io/hc/en-us/articles/115001423511-Keyboard-shortcuts)
- [Linear Ctrl/Cmd shortcuts](https://linear.app/docs/search)
- [Linear issue URL shortcut](https://linear.app/changelog/page/22)
- [Gmail platform restrictions](https://support.google.com/mail/answer/6594?hl=en)
- [Atom Windows keymap source](https://github.com/atom/atom/blob/master/keymaps/win32.cson)
- [Xcode host requirements](https://developer.apple.com/xcode/system-requirements)
- [Kitty installation platforms](https://sw.kovidgoyal.net/kitty/binary/)
- [Chromium Document Value provider](https://chromium.googlesource.com/chromium/src/+/HEAD/ui/accessibility/platform/ax_platform_node_delegate_utils_win.cc)

Browser capture corroborates the address with the visible top-level Document URL, excludes page-controlled address lookalikes, and refuses execution while keyboard focus is outside web content. The exact captured address and committed document URL are retained separately from hostname canonicalization. PowerShell outputs UTF-8 for Unicode URL round trips.

Zoom’s six iOS-only bindings are removed from the desktop catalog; its actual Windows and macOS keymaps remain. Their removed saved references are included in the same explicit compatibility decision.

Windows checkout uses LF for deterministic generated-contract checks and formatting. Native URL tests cover scheme omission, Chromium leading-www elision, percent-escape display differences, Unicode, and mismatched paths/queries/hosts. URL corroboration uses Windows URI rules; raw values still guard every injected chord.

- [Chromium omnibox display elision](https://chromium.googlesource.com/chromium/src/+/HEAD/components/omnibox/browser/location_bar_model_impl.cc)

The Windows-only input-delivery test opens a disposable WinForms edit control and runs the actual production-generated shortcut scripts in separate PowerShell processes. It checks Ctrl+A by observing the selected text, layout-mapped `+` by observing inserted text, and Ctrl+K then Ctrl+S by observing ordered key events, with no held modifiers afterward. This verifies delivery into a real desktop control when Windows CI passes; it does not exercise Raycast's Apply UI or vendor applications/browser UIA.

The first delivery run exposed a production bug missed by helper tests: `[ushort[]]` is a C# type spelling not recognized by Windows PowerShell 5.1. The production script now casts keys to `[System.UInt16[]]`. Keep delivery tests enabled on Windows to exercise the complete generated script rather than only its helpers.

Astra’s accelerator-layout finding is fixed by serializing ASCII letter/digit shortcut tokens as Windows virtual keys. Only symbols use target-layout character mapping. Native input delivery now runs with explicitly loaded US and French AZERTY layouts: it verifies the target’s active language, confirms French typing of `1` requires Shift, then observes Ctrl+1/Ctrl+9/Ctrl+0 arriving without Shift through the production script. Ctrl+A, `+`, multi-chord order, and modifier release are checked on both layouts.

Vendor acceptance should also include bare digit commands on non-US layouts: these tokens intentionally represent virtual keys, which can produce different typed characters (for example, French VK_1 produces `&` without Shift).
