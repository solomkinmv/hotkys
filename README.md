# Shortcuts Disco

Web site and RayCast extension that allows you to find shortcuts for your app.

RayCast extension adds additional automation features:

1. Find shortcuts for the frontmost application
2. Run shortcuts by selecting from the list
3. Copy bundle id for the frontmost application

## Shortcuts Contribution

Shortcuts are stored as a json files in `shortcuts-site/shortcuts-data`.
GitHub [link](https://github.com/solomkinmv/shortcuts-disco/tree/main/shortcuts-site/shortcuts-data).

Interfaces for input model can be found by
this [link](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-site/src/core/model/input/input-models.ts).

To add new application create a json file in `shortcuts-site/shortcuts-data` with following template:

```json
{
  "$schema": "schema/shortcut.schema.json"
}
```

Schema will help with json structure. It doesn't provide all the validation, but dramatically simplifies the whole
process.

Each application is described by `name` and `bundleId` of the macOS application.

> **Note:** currently support only macOs. Please vote for this feature [here](https://github.com/solomkinmv/shortcuts-disco/issues/2).

* App contains `keymaps`
* Keymap contain `title` and list of `sections` 
* Section contains `title` and list of `shortcuts`
* Shortcut contain `title` and shortcut declaration inside `key` property

Shortcuts `key` rules:
* Key consist of modifiers plus base key separated by `+` sign.
* Supported modifiers: `ctrl`, `shift`, `pt`, `cmd`. Modifiers should be specified in that exact order, lowercase [{@link modifierTokens}](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-site/src/core/model/internal/modifiers.ts).
* Final shortcut token should always be a base key. List of all base keys: [{@link public/data/key-codes.json}](https://github.com/solomkinmv/shortcuts-disco/blob/main/shortcuts-site/public/data/key-codes.json).
* As an exception, `(click)` can be used instead of base key to show mouse click.
* Examples: `ctrl+s`, `shift+cmd+e`.
* Shortcut macro or sequences of shortcuts are also supported and should be separated by space (` `).
* Example: `cmd+k cmd+s` (first press `Cmd+K` and then `Cmd+S`)

<details>
  <summary>Basic example of shortcuts for Safari</summary>

```json
{
  "$schema": "schema/shortcut.schema.json",
  "bundleId": "com.apple.Safari",
  "name": "Safari",
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
          "title": "Current Webpage",
          "shortcuts": [
            {
              "title": "Search the current webpage",
              "key": "cmd+f"
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
</details>
