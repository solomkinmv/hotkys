# Hotkys website

Next.js static export with a generated shortcut catalog and optional Clerk/Supabase private features.

```bash
npm ci
npm run dev
npm run validate-data
npm run test:types
npm test -- --runInBand
npm run test:rls
npm run lint
npm run build
```

`build` generates the catalog and exports the website to `out/`. Serve `out/` with a static web server; `next start` does not serve static exports. Development and generation never format source files. Use `npm run prettify -- --write <slug>.json` explicitly.

See [contribution instructions](../CONTRIBUTING.md) for JSON grammar, local Raycast preview, generated assets, and compatibility review. See [auth operations](../docs/auth-operations.md) before enabling accounts or applying migrations. Public-only local development should leave all account configuration unset.
