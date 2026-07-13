# Shortcuts Search RayCast extension

Allows to list, search and run shortcuts for different applications on macOS and Windows.

By selecting a shortcut, the extension actually runs the shortcut:
- macOS: using AppleScript
- Windows: using PowerShell with SendKeys

Data is taken from: https://hotkys.com.

Please see contribution guide for adding new shortcuts [here](https://github.com/solomkinmv/hotkys/blob/main/README.md#shortcuts-contribution).

## Commands
### List All Shortcuts
Show shortcuts for all available desktop or web applications.

### List Current Shortcuts
Show shortcuts for the frontmost desktop application. Command will exit if no desktop application
is detected or if it is missing in the Hotkys database.

- macOS: matches applications by bundle ID (e.g., `com.microsoft.VSCode`)
- Windows: matches applications by Windows App ID from Raycast's `getFrontmostApplication()` API

### List Current Web Shortcuts
Show shortcuts for the frontmost web application. Command will exit if no web application
is detected or if it is missing in the Hotkys database.

macOS:
- Supported browsers: Safari, Chrome, Arc
- Not supported browsers: Firefox

Windows:
- Supported browsers: Chrome, Edge, Firefox
- URL extraction via PowerShell UI Automation framework

### Copy Current App's Bundle ID
Saves current app's identifier to the clipboard. Useful for contributing new shortcuts.

- macOS: copies the bundle ID (e.g., `com.microsoft.VSCode`)
- Windows: copies the Windows App ID

## Platform Implementation Details

### Windows Support
Windows support is implemented using PowerShell scripting:

- **Shortcut execution**: Uses `System.Windows.Forms.SendKeys.SendWait()` via PowerShell
  - Modifiers: `^` = Ctrl, `%` = Alt, `+` = Shift
  - Special keys: `{ENTER}`, `{TAB}`, `{F1}` through `{F16}`, arrow keys, etc.
  - Activates target app window before sending keys

- **Browser URL extraction**: Uses PowerShell UI Automation framework
  - Chrome/Edge: queries "Address and search bar" automation property
  - Firefox: uses different automation property name

- **App matching**: Uses `windowsAppId` from Raycast's `getFrontmostApplication()` API

- **Key codes**: Windows uses named keys directly (e.g., `"a"`, `"{F5}"`) instead of numeric codes

### macOS Support
- **Shortcut execution**: Uses AppleScript/JXA via `runAppleScript`
- **Browser URL extraction**: Uses AppleScript to query browser windows
- **App matching**: Uses `bundleId` from `getFrontmostApplication().bundleId`
- **Key codes**: Uses numeric JXA key codes from `key-codes.json`

## Screenshots

![list of all applications](metadata/shortcuts-search-1.png)
![search of applications](metadata/shortcuts-search-2.png)
![list of all shortcuts for safari](metadata/shortcuts-search-3.png)
![search of shortcuts for safari](metadata/shortcuts-search-4.png)
