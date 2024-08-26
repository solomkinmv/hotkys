# Hotkys

Website and Raycast extension that allows you to find shortcuts for your app.

The Raycast extension adds additional automation features:

1. Find shortcuts for the frontmost application
2. Run shortcuts by selecting from the list
3. Copy bundle id for the frontmost application

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
- The `bundleId` is an optional field, which helps identify a macOS application. It is not applicable to websites or web apps. Use the Raycast command "Copy Current App's Bundle Id" included with the Raycast extension to find the bundle Id of the application you want to add. 
- An application can have multiple `keymaps`. Usually there is just one, named "Default". A keymap can have multiple sections of shortcuts. Each one has a title.

**Shortcut information**
- A shortcut definition always has a `title`. For the rest, it must contain a `key` field, `comment` field, or both. 
- `key` contains a **structured** shortcut declaration in a string. The rules are as follows:
  * A `key` consists of modifiers plus a base key separated by `+` sign(s).
  * Supported modifiers: `ctrl`, `shift`, `opt`, `cmd`. Modifiers should be specified in that exact order and be lowercase [{@link modifierTokens}](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-disco-site/src/lib/model/internal/modifiers.ts).
    - ❌ Invalid example: ~~`Cmd+Shift+Option+E`~~
    - ✅ Valid example: `shift+opt+cmd+e`
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
