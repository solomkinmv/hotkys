# Hotkys

Website and Raycast extension that allows you to find shortcuts for your app on macOS and Windows.

The Raycast extension adds additional automation features:

1. Find shortcuts for the frontmost application
2. Run shortcuts by selecting from the list (works on both macOS and Windows)
3. Copy bundle ID (macOS) or Windows App ID (Windows) for the frontmost application

## Contributing shortcuts

Shortcut definitions are stored as JSON files in [`shortcuts-disco-site/shortcuts-data`](shortcuts-disco-site/shortcuts-data). Each application has one file.

To add shortcuts for a new application or web app, create a new JSON file, like `example-app.json`. To understand the required structure, take a look at this basic example with a subset of Safari's shortcuts:

```json
{
  "$schema": "schema/shortcut.schema.json",
  "bundleId": "com.apple.Safari",
  "name": "Safari",
  "slug": "safari",
  "keymaps": [
    {
      "title": "Default",
      "platforms": ["macos"],
      "sections": [
        {
          "title": "Bookmarks",
          "shortcuts": [
            {
              "title": "Open Bookmarks Manager",
              "key": "opt+cmd+b"
            }
          ]
        },
        {
          "title": "Other",
           "shortcuts": [
            {
              "title": "Modify the toolbar",
              "comment": "Hold Cmd while dragging a toolbar element"
            },
            {
              "title": "Print the current webpage",
              "key": "cmd+p"
            }
          ]
        }
      ]
    }
  ]
}
```
The structure contains the following information:

**Application information**
- Each application has a `name` and `slug`.
- The `bundleId` is an optional field for macOS applications. Use the Raycast command "Copy Current App's Bundle Id" to find it.
- The `windowsAppId` is an optional field for Windows applications. Use the same Raycast command on Windows to copy the Windows App ID.
- Bundle/App IDs are not applicable to websites or web apps.
- An application can have multiple `keymaps`. Usually there is just one, named "Default". A keymap can have multiple sections of shortcuts. Each one has a title.
- Each keymap can specify a `platforms` field (array) to indicate which operating systems it's designed for. Supported values are `"windows"`, `"linux"`, and `"macos"`. The platforms will be visually indicated in the UI with badges.
  - Single platform: `"platforms": ["macos"]`
  - Multiple platforms: `"platforms": ["windows", "linux"]` (when shortcuts are identical across those platforms)
  - Platform-specific keymaps: When shortcuts differ between platforms (e.g., `cmd+s` on macOS vs `ctrl+s` on Windows), create separate keymaps with different titles like "macOS" and "Windows", each with their own `platforms` array
  - At least one platform must be specified if the `platforms` field is present
  - Duplicate platforms within the same keymap are not allowed

**Shortcut information**
- A shortcut definition always has a `title`. For the rest, it must contain a `key` field, `comment` field, or both. 
- `key` contains a **structured** shortcut declaration in a string. The rules are as follows:
  * A `key` consists of modifiers plus a base key separated by `+` sign(s).
  * Supported modifiers: `ctrl`, `shift`, `opt`, `cmd`, `win`. Modifiers should be specified in that exact order and be lowercase [{@link modifierTokens}](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-disco-site/src/lib/model/internal/modifiers.ts).
    - ❌ Invalid example: ~~`Cmd+Shift+Option+E`~~
    - ✅ Valid example: `shift+opt+cmd+e`
    - ✅ Windows example: `win+e` (Windows Explorer)
  * Final shortcut token should always be a base key. List of all base keys: [{@link public/data/key-codes.json}](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-disco-site/public/data/key-codes.json).
    * Examples: `ctrl+s`, `shift+cmd+e`.
  * Shortcut macro or sequences of shortcuts are also supported and should be separated by space (` `).
    * Example: `cmd+k cmd+s` (first press `Cmd+K` and then `Cmd+S`)
- `comment` can be any string. Use it to explain the shortcut further, if necessary, or to represent shortcuts that are more easily described in a sentence (such as "Hold key Cmd while clicking item X") 

The TypeScript interfaces for the keyboard definition model with all options can be found [here](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-disco-site/src/lib/model/input/input-models.ts).


### JSON schema

The schema in the first line (`"$schema": "schema/shortcut.schema.json"`) will help with validating the JSON structure.

Using it, an editor like VS Code will automatically show warnings if the JSON structure is invalid. It doesn't provide all the required validation, but dramatically simplifies the whole process.

### Fixing the JSON format

Use the `prettify` script to format all the JSON files and fix the order of key modifiers.

Go to `shortcuts-disco-site` folder and run:

```bash
npm run prettify
```
