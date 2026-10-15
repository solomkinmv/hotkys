# Contributing shortcuts

Hotkys accepts reviewed JSON contributions through pull requests. Creating a private app or downloading its JSON does not publish it.

## From a draft to a pull request

1. Fork this repository and create a branch. Use Node 22 or later; Raycast development also needs macOS or Windows with Raycast installed.
2. Run `npm --prefix shortcuts-disco-site ci` and `npm --prefix shortcuts-raycast-extension ci` from the repository root. Public browsing and catalog validation require no Clerk or Supabase configuration.
3. Create or correct a draft in My Shortcuts, including app name, slug, source, desktop bundle ID or web hostname, keymap platforms, sections, and rows. Use Save controls before exporting. Empty containers can be saved as drafts; export requires populated valid sections.
4. Export only the selected app with **Download JSON** or **Copy JSON**. Place it at `shortcuts-disco-site/shortcuts-data/<slug>.json`. For an existing public app, edit that source file directly: private overlays are not a public catalog export.
5. Cite the app's official shortcut documentation in `source`. Mention the tested app/version/platform in the PR. Include only icons you have permission to contribute, under `shortcuts-disco-site/public/icons/`, and describe their source. Local icon paths must stay inside `public/`, including symlink resolution.
6. Run the checks below, preview the website and extension, then open a PR using the template. The export's **Contribution text** tab provides read-only PR description text with **Copy Description**; **Report an Issue** is a separate issue-reporting action.

## Grammar and structure

The JSON schema is `shortcuts-disco-site/shortcuts-data/schema/shortcut.schema.json`, published at `https://hotkys.com/schema/shortcut.schema.json`. Use this URL in `$schema`. The filename must match the slug. Slugs beginning `custom-` and generated names such as `apps`, `combined-apps`, `key-codes`, and `schema` are reserved. Keymap titles must produce distinct, nonempty URL paths.

A row needs a title and a key or comment. Keys use lowercase modifiers `ctrl`, `shift`, `opt` (alias `alt`), `cmd`, `win`, in that order, followed by one base key. Validation rejects any other modifier order. `npm --prefix shortcuts-disco-site run prettify -- --write <slug>.json` sorts modifiers and normalizes `option`→`opt`, `command`→`cmd`, `escape`→`esc`, and `pgup`/`pgdown`→`pageup`/`pagedown`; the filename is resolved inside `shortcuts-data/`. Examples: `shift+cmd+p`, `cmd+k cmd+s`, `+`, `cmd++`. Spaces separate sequential chords. Unknown or repeated modifiers and unknown base keys are rejected. Consult `public/data/key-codes.json` for base keys. Comment-only rows are displayed without execution.

Windows desktop contributions may set `windowsAppId` to the identifier copied from Raycast and `windowsProcessName` to the executable filename without `.exe`. These are separate values: an AppUserModelID is not a process name. Use the [Windows verification guide](docs/verification/windows-support.md#interactive-windows-acceptance) to confirm execution on the contributed app/version. The generated website and Raycast catalogs preserve both fields.

Omitted platforms mean all supported platforms. An explicit array contains one or more distinct values from `macos`, `windows`, `linux`. Use separate keymaps when bindings differ. Keep deliberate section/row order; move controls in the editor adjust it.

## Local commands

Run from the repository root:

```bash
npm --prefix shortcuts-disco-site run prettify -- --write example-app.json
npm --prefix shortcuts-disco-site run validate-data
npm --prefix shortcuts-disco-site run format-data:check
npm --prefix shortcuts-disco-site run test:catalog
node scripts/sync-shortcuts-core.mjs --check
npm --prefix shortcuts-disco-site test -- --runInBand
npm --prefix shortcuts-raycast-extension test -- --runInBand
npm --prefix shortcuts-disco-site run test:types
npm --prefix shortcuts-raycast-extension run test:types
npm --prefix shortcuts-disco-site run lint
npm --prefix shortcuts-raycast-extension run lint
npm --prefix shortcuts-disco-site run build
npm --prefix shortcuts-raycast-extension run build
```

Only `prettify -- --write` changes source JSON. `export-data`, builds, and the development watcher validate first and regenerate combined data, per-platform manifests/app files, and the public schema. `build` and `dev` also run `optimize-images`, which writes site-only WebP variants of bundled icons, the logo and the hero image to the ignored `public/optimized/` folder; the original PNG icons remain the published assets used by Raycast. Deleted apps and removed platform variants disappear from generated output; tracked key codes are preserved. Do not edit generated catalog files or generated shortcut-core copies. Edit `shared/shortcuts-core` and run `node scripts/sync-shortcuts-core.mjs --write` when changing shared behavior.

`npm --prefix shortcuts-disco-site run dev` starts Next.js and watches source JSON, schema, and key codes. Open `http://localhost:3000`. In another terminal run:

```bash
npm --prefix shortcuts-raycast-extension run dev:catalog -- --origin http://localhost:3000
```

This temporarily creates an ignored development asset for all extension catalog, key-code, and icon requests. Close that process to remove it. Release build/publish checks reject an active override; the released extension uses `https://hotkys.com`. This changes catalog origin only, not authentication. If a crashed process leaves the asset, inspect and remove `shortcuts-raycast-extension/assets/catalog-development.json` before release.

## Compatibility review

Saved favorites and overlays reference a row by its section, key, title and comment. Changing any of these on an existing row, or removing it, orphans what users saved for it, so do it only to fix real errors and say so in the PR.

For account/schema work, also run `npm --prefix shortcuts-disco-site run test:rls` and follow [auth operations](docs/auth-operations.md). Screenshots and private account diagnostics belong outside Git. Never contribute tokens, credentials, or another account's exports.
