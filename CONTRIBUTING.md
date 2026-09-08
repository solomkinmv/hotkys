# Contributing shortcuts

Hotkys accepts reviewed JSON contributions through pull requests. Creating a private app or downloading its JSON does not publish it.

## From a draft to a pull request

1. Fork this repository and create a branch. Use Node 22 or later; Raycast development also needs macOS and Raycast.
2. Run `npm --prefix shortcuts-disco-site ci` and `npm --prefix shortcuts-raycast-extension ci` from the repository root. Public browsing and catalog validation require no Clerk or Supabase configuration.
3. Create or correct a draft in My Shortcuts, including app name, slug, source, desktop bundle ID or web hostname, keymap platforms, sections, and rows. Use Save controls before exporting. Empty containers can be saved as drafts; export requires populated valid sections.
4. Export only the selected app with **Download** or **Copy JSON**. Place it at `shortcuts-disco-site/shortcuts-data/<slug>.json`. For an existing public app, edit that source file directly: private overlays are not a public catalog export.
5. Cite the app's official shortcut documentation in `source`. Mention the tested app/version/platform in the PR. Include only icons you have permission to contribute, under `shortcuts-disco-site/public/icons/`, and describe their source. Local icon paths must stay inside `public/`, including symlink resolution.
6. Run the checks below, preview the website and extension, then open a PR using the template. The export's **Contribution Summary** is editable PR text; **Report an Issue** is a separate issue-reporting action.

## Grammar and structure

The JSON schema is `shortcuts-disco-site/shortcuts-data/schema/shortcut.schema.json`, published at `https://hotkys.com/schema/shortcut.schema.json`. Use this URL in `$schema`. The filename must match the slug. Slugs beginning `custom-` and generated names such as `apps`, `combined-apps`, `key-codes`, and `schema` are reserved. Keymap titles must produce distinct, nonempty URL paths.

A row needs a title and a key or comment. Keys use lowercase modifiers `ctrl`, `shift`, `opt` (alias `alt`), `cmd`, `win`, followed by one base key. Formatting puts modifiers in that order. Examples: `shift+cmd+p`, `cmd+k cmd+s`, `+`, `cmd++`. Spaces separate sequential chords. Unknown or repeated modifiers and unknown base keys are rejected. Consult `public/data/key-codes.json` for base keys. Comment-only rows are displayed without execution.

Omitted platforms mean all supported platforms. An explicit array contains one or more distinct values from `macos`, `windows`, `linux`. Use separate keymaps when bindings differ. Keep deliberate section/row order; move controls in the editor adjust it.

## Local commands

Run from the repository root:

```bash
npm --prefix shortcuts-disco-site run prettify -- --write example-app.json
npm --prefix shortcuts-disco-site run validate-data
npm --prefix shortcuts-disco-site run format-data:check
npm --prefix shortcuts-disco-site run test:catalog
node scripts/sync-shortcuts-core.mjs --check
node scripts/check-catalog-identities.mjs origin/main
npm --prefix shortcuts-disco-site test -- --runInBand
npm --prefix shortcuts-raycast-extension test -- --runInBand
npm --prefix shortcuts-disco-site run test:types
npm --prefix shortcuts-raycast-extension run test:types
npm --prefix shortcuts-disco-site run build
npm --prefix shortcuts-raycast-extension run build
```

Only `prettify -- --write` changes source JSON. `export-data`, builds, and the development watcher validate first and regenerate combined data, per-platform manifests/app files, and the public schema. Deleted apps and removed platform variants disappear from generated output; tracked key codes are preserved. Do not edit generated catalog files or generated shortcut-core copies. Edit `shared/shortcuts-core` and run `node scripts/sync-shortcuts-core.mjs --write` when changing shared behavior.

`npm --prefix shortcuts-disco-site run dev` starts Next.js and watches source JSON, schema, and key codes. Open `http://localhost:3000`. In another terminal run:

```bash
npm --prefix shortcuts-raycast-extension run dev:catalog -- --origin http://localhost:3000
```

This temporarily creates an ignored development asset for all extension catalog, key-code, and icon requests. Close that process to remove it. Release build/publish checks reject an active override; the released extension uses `https://hotkys.com`. This changes catalog origin only, not authentication. If a crashed process leaves the asset, inspect and remove `shortcuts-raycast-extension/assets/catalog-development.json` before release.

## Compatibility review

Public favorites/overlays may contain derived identities incorporating app/keymap/section names, binding, title, comment, and duplicate occurrence. Renames and edits can break saved references. CI compares existing references against the PR base and prints affected rows plus a fingerprint. Record that exact fingerprint and a substantive `reason` in `docs/catalog-compatibility.json` only after choosing a compatibility strategy: a proven deterministic alias/migration, retaining the original row, or explicitly accepting unresolved legacy references. Do not guess same-title matches or silently delete unresolved favorites. Pure additions and formatting without semantic changes pass automatically.

For account/schema work, also run `npm --prefix shortcuts-disco-site run test:rls` and follow [auth operations](docs/auth-operations.md). Screenshots and private account diagnostics belong outside Git. Never contribute tokens, credentials, or another account's exports.
