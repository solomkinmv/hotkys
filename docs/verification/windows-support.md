# Windows support verification

Windows support shipped in https://github.com/solomkinmv/hotkys/pull/131. Windows CI runs the native PowerShell, Win32 and input-delivery tests (US and French AZERTY layouts). It does not cover Raycast's Apply UI, vendor applications, browser UI Automation across versions and languages, or signed-in Windows OAuth. The interactive pass below is still pending.

## Custom app identifiers

Custom apps support optional `windowsAppId` and `windowsProcessName` alongside the macOS bundle ID. Use the Windows ID returned by Raycast or an executable name without `.exe` (for example, `Code`). An AppUserModelID is not a process name. An explicit Windows app ID takes precedence over a saved process name; Apply is unavailable if that ID is missing, ambiguous, or has no resolvable executable.

“Copy Current App's ID” copies the Windows app ID when available, otherwise a resolvable executable process name.

## Interactive Windows acceptance

1. Install/import the extension in Raycast for Windows. Test all four commands with public catalog access and no account credentials.
2. Open one VS Code, Chrome, or Sublime window. Current Shortcuts should choose its Windows keymap. All Shortcuts should show its Windows process identity and the same shortcuts. Copy Current App's ID should copy the native Windows application identifier.
3. Apply a harmless binding (e.g. Ctrl+A in a scratch document), a sequence (Ctrl+K Ctrl+S in VS Code), and punctuation (Ctrl++). Confirm the intended action, no lingering modifiers, and completed command navigation. Test Win+Left in a disposable window.
4. Change focus during a 5-second delay. Close the target. Open multiple target windows. Confirm cancellation without input to another app. Elevated targets should fail from non-elevated Raycast without automatic retries.
5. Open a supported browser at a catalog site (e.g. Gmail or Linear). List Current Web Shortcuts should resolve its hostname. Change tab/path/query during a delay; confirm Apply stops. Try unsupported schemes, browsers, missing address bars, and localized browser UI.
6. Connect/disconnect an account, load private Windows/macOS keymaps, favorite and overlay a base Windows shortcut, and switch accounts. Confirm platform filtering, stable favorite identity, and no stale private data.
7. Create, edit, clear, export and reload both custom app identifier fields, then select a renamed custom app and apply a harmless shortcut in its intended app.
8. On a non-US layout, apply bare digit shortcuts. Letter and digit tokens are sent as virtual keys, so they can type different characters (French VK_1 produces `&` without Shift).
