# Windows Support for Raycast Extension

## Overview
- Port the existing macOS-only Raycast extension to support Windows with full parity
- All 4 commands (list all, current app, current web, copy app ID) working on Windows
- Shortcut execution via PowerShell `SendKeys` (`.NET System.Windows.Forms`)
- Browser URL extraction via PowerShell UI Automation framework
- App matching via `windowsAppId` (from Raycast's `getFrontmostApplication()` API)

## Context (from discovery)
- **Files/components involved:**
  - `package.json` — add `platforms: ["macOS", "Windows"]`
  - `src/engine/shortcut-runner.ts` — currently macOS-only (JXA/osascript), needs Windows branch
  - `src/engine/frontmost-hostname-fetcher.tsx` — currently AppleScript-only, needs PowerShell branch
  - `src/model/internal/modifiers.ts` — hardcoded macOS modifier strings, needs platform-aware mapping
  - `src/model/internal/internal-models.ts` — `Application` type needs `windowsAppId` field
  - `src/model/input/input-models.ts` — `InputApp` and `AppMetadata` need `windowsAppId` field
  - `src/view/hotkey-text-formatter.ts` — uses macOS-only modifier symbols, needs Windows symbols
  - `src/app-shortcuts.tsx` — uses `bundleId` for matching, needs `windowsAppId` fallback
  - `src/current-app.ts` — copies `bundleId`, should copy `windowsAppId` on Windows
  - `src/load/platform.ts` — already supports Windows detection
  - `src/load/apps-provider.ts` — already platform-aware
  - `src/load/key-codes-provider.ts` — key codes are macOS-specific (JXA numeric codes), Windows uses named keys for SendKeys
  - `src/all-shortcuts.tsx` — subtitle shows bundleId, should show windowsAppId on Windows

- **Raycast API support:**
  - `runPowerShellScript` from `@raycast/utils` — Windows counterpart to `runAppleScript`
  - `getFrontmostApplication()` — returns `windowsAppId` on Windows
  - `platforms` manifest field — `["macOS", "Windows"]`
  - Platform-specific preferences via object syntax: `{ "macOS": "foo", "Windows": "bar" }`

- **Windows shortcut execution approach:**
  - Use `System.Windows.Forms.SendKeys.SendWait()` via PowerShell
  - Modifier mapping: `^` = Ctrl, `%` = Alt, `+` = Shift
  - Special keys: `{ENTER}`, `{TAB}`, `{ESC}`, `{HOME}`, `{END}`, `{F1}`–`{F12}`, `{LEFT}`, `{RIGHT}`, `{UP}`, `{DOWN}`, etc.
  - Activate target app via process ID before sending keys

- **Windows browser URL extraction:**
  - Use PowerShell UI Automation framework to query browser address bar
  - Chrome/Edge share the same "Address and search bar" automation property name
  - Firefox has a different property name

- **Key codes:**
  - macOS uses numeric JXA key codes (e.g., `key-codes.json` maps `"a" → "0"`, `"s" → "1"`)
  - Windows `SendKeys` uses named keys directly (e.g., `"a"`, `"{F5}"`, `"{HOME}"`)
  - Need separate key mapping for Windows or build SendKeys strings directly from key names

## Development Approach
- **Testing approach**: Regular (code first, then tests)
- Complete each task fully before moving to the next
- Make small, focused changes
- **CRITICAL: every task MUST include new/updated tests** for code changes in that task
- **CRITICAL: all tests must pass before starting next task**
- **CRITICAL: update this plan file when scope changes during implementation**
- Run tests after each change
- Maintain backward compatibility — all existing macOS functionality must continue working

## Testing Strategy
- **Unit tests**: required for every task
- Platform-specific code will be tested by mocking `getPlatform()` to return `"windows"` or `"macos"`
- PowerShell script generation logic can be unit tested (string output verification)
- Modifier mapping and key formatting can be tested on any platform

## Progress Tracking
- Mark completed items with `[x]` immediately when done
- Add newly discovered tasks with ➕ prefix
- Document issues/blockers with ⚠️ prefix
- Update plan if implementation deviates from original scope

## Implementation Steps

### Task 1: Add `platforms` field to manifest and update data models
- [x] Add `"platforms": ["macOS", "Windows"]` to `package.json`
- [x] Add `windowsAppId?: string` field to `InputApp` in `src/model/input/input-models.ts`
- [x] Add `windowsAppId?: string` field to `AppMetadata` in `src/model/input/input-models.ts`
- [x] Add `windowsAppId?: string` field to `Application` in `src/model/internal/internal-models.ts`
- [x] Pass `windowsAppId` through in `ShortcutsParser.parseInputShortcuts()` in `src/load/input-parser.ts`
- [x] Write tests for parser passing through `windowsAppId`
- [x] Run tests — must pass before next task

### Task 2: Make modifier system platform-aware
- [x] Refactor `src/model/internal/modifiers.ts` to support both macOS and Windows modifier representations
  - macOS: `"command down"`, `"control down"`, `"option down"`, `"shift down"` (for JXA)
  - Windows: `"^"` (Ctrl), `"%"` (Alt), `"+"` (Shift) (for SendKeys)
  - Keep macOS modifier enum values unchanged for backward compatibility
  - Add Windows-specific modifier symbols for display: `"Ctrl"`, `"Alt"`, `"Shift"`, `"Win"`
- [x] Add `win` modifier token (mapped to Windows key) for Windows shortcuts that use `win` modifier
- [x] Update `modifierMapping` to include `"win"` token
- [x] Update `modifierSymbols` to be platform-aware — return `"⌘"` on macOS, `"Ctrl"` on Windows, etc.
- [x] Write tests for platform-specific modifier mapping and symbols
- [x] Run tests — must pass before next task

### Task 3: Make hotkey text formatter platform-aware
- [x] Update `src/view/hotkey-text-formatter.ts` to use platform-aware modifier symbols
- [x] Update `baseKeySymbolOverride` map for Windows (e.g., no `⌘` symbol, use text labels instead)
- [x] Write tests for Windows hotkey text formatting
- [x] Run tests — must pass before next task

### Task 4: Implement Windows shortcut execution
- [ ] Create `src/engine/windows-shortcut-runner.ts` with PowerShell-based execution
  - Build PowerShell script that:
    1. Loads `System.Windows.Forms` assembly
    2. Activates target app window (by process name or windowsAppId)
    3. Applies configurable delay
    4. Sends key combinations using `SendKeys.SendWait()`
  - Map modifier enums to SendKeys format: `ctrl` → `^`, `alt/opt` → `%`, `shift` → `+`
  - Map base keys to SendKeys format: letters stay as-is, special keys get `{KEY}` syntax
  - Support chord sequences (multiple key combos in series)
- [ ] Use `runPowerShellScript` from `@raycast/utils` to execute the script
- [ ] Update `src/engine/shortcut-runner.ts` (`runShortcuts` function) to dispatch to Windows runner when `getPlatform() === "windows"`
- [ ] Remove the early-return error toast for non-macOS platforms
- [ ] Write tests for PowerShell script generation (string output verification)
- [ ] Write tests for SendKeys modifier/key mapping
- [ ] Run tests — must pass before next task

### Task 5: Implement Windows browser URL extraction
- [ ] Create `src/engine/windows-hostname-fetcher.ts` with PowerShell-based URL extraction
  - Use UI Automation framework to query browser address bar
  - Support Chrome, Edge (shared "Address and search bar" property name)
  - Support Firefox (different property name)
  - Return the URL string, or null if no browser is frontmost
- [ ] Update `src/engine/frontmost-hostname-fetcher.tsx` to dispatch to Windows fetcher when on Windows
- [ ] Write tests for hostname extraction logic (URL parsing is already tested, focus on dispatch logic)
- [ ] Run tests — must pass before next task

### Task 6: Update app-matching commands for Windows
- [ ] Update `src/app-shortcuts.tsx` to use `windowsAppId` for app matching on Windows
  - On macOS: match by `bundleId` (existing behavior)
  - On Windows: match by `windowsAppId` from `getFrontmostApplication()`
- [ ] Update `src/current-app.ts` to copy `windowsAppId` on Windows instead of `bundleId`
- [ ] Update `src/all-shortcuts.tsx` subtitle to show `windowsAppId` on Windows
- [ ] Write tests for platform-conditional app matching logic
- [ ] Run tests — must pass before next task

### Task 7: Handle key codes for Windows
- [ ] Determine if `key-codes.json` is needed on Windows (SendKeys uses named keys, not numeric codes)
- [ ] If not needed: skip key code loading on Windows, build SendKeys strings directly from key names
- [ ] If needed: create a Windows-specific key code mapping
- [ ] Update `src/load/key-codes-provider.ts` to handle Windows case
- [ ] Update shortcut runner to work without numeric key codes on Windows
- [ ] Write tests for Windows key name to SendKeys format mapping
- [ ] Run tests — must pass before next task

### Task 8: Verify acceptance criteria
- [ ] Verify all 4 commands work conceptually for Windows (code review)
- [ ] Verify macOS functionality is unchanged (run full test suite)
- [ ] Verify edge cases: apps without windowsAppId, shortcuts with sequences/chords, special keys
- [ ] Run full test suite (unit tests)
- [ ] Run linter — all issues must be fixed
- [ ] Verify type checking passes (`tsc --noEmit` or equivalent)

### Task 9: [Final] Update documentation
- [ ] Update README.md if needed (mention Windows support)
- [ ] Add any relevant notes to CLAUDE.md or project docs about Windows-specific patterns

## Technical Details

### PowerShell SendKeys Format
```
Modifiers: ^ = Ctrl, % = Alt, + = Shift
Letters: a-z (lowercase)
Special keys: {ENTER}, {TAB}, {ESC}, {BACKSPACE}, {DELETE}, {HOME}, {END}
Arrow keys: {LEFT}, {RIGHT}, {UP}, {DOWN}
Page keys: {PGUP}, {PGDN}
Function keys: {F1} through {F16}
Combinations: ^c = Ctrl+C, %{F4} = Alt+F4, +{F5} = Shift+F5
Sequences: send one combo, then another (separate SendWait calls)
```

### PowerShell Script Template for Shortcut Execution
```powershell
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

# Activate target application
$proc = Get-Process | Where-Object { $_.MainWindowTitle -and $_.Id -eq <PID> }
[Microsoft.VisualBasic.Interaction]::AppActivate($proc.Id)
Start-Sleep -Milliseconds <delay>

# Send key combination
[System.Windows.Forms.SendKeys]::SendWait("^s")  # Example: Ctrl+S
```

### PowerShell Script Template for Browser URL Extraction
```powershell
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$root = [System.Windows.Automation.AutomationElement]::RootElement
# Find browser window, then query "Address and search bar" element
# Return URL string
```

### Modifier Mapping (macOS → Windows display)
| Key in data | macOS display | macOS JXA | Windows display | Windows SendKeys |
|-------------|--------------|-----------|-----------------|-----------------|
| `cmd` | ⌘ | `command down` | Ctrl | `^` |
| `ctrl` | ⌃ | `control down` | Ctrl | `^` |
| `opt`/`alt` | ⌥ | `option down` | Alt | `%` |
| `shift` | ⇧ | `shift down` | Shift | `+` |
| `win` | — | — | Win | (special handling) |

**Note on `cmd` → `Ctrl` mapping**: On Windows, `cmd` in shortcut data maps to `Ctrl` because Windows shortcuts use `Ctrl` where macOS uses `Cmd`. The data files already have platform-specific keymaps (`"platforms": ["windows"]`) with the correct modifier for each platform, so we just need to map the data modifier names to SendKeys format.

### App Identification
| Platform | Field | Example | Source |
|----------|-------|---------|--------|
| macOS | `bundleId` | `com.microsoft.VSCode` | `getFrontmostApplication().bundleId` |
| Windows | `windowsAppId` | TBD (need to check actual values) | `getFrontmostApplication().windowsAppId` |

## Post-Completion

**Manual verification** (requires Windows machine):
- Test all 4 commands on Windows with Raycast
- Test shortcut execution with various apps (VS Code, Chrome, etc.)
- Test browser URL extraction with Chrome, Edge, Firefox
- Test chord sequences (e.g., `Ctrl+K Ctrl+S` in VS Code)
- Verify special key handling (F-keys, arrow keys, Home/End, etc.)
- Test with apps that have no windowsAppId

**Data updates**:
- Populate `windowsAppId` for existing Windows apps in shortcuts data files
- May need to research actual `windowsAppId` values on a Windows machine

**Raycast Store**:
- Submit updated extension for Windows review
- Ensure compliance with Raycast extension guidelines for Windows
