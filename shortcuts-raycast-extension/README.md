# Hotkys Raycast extension

Search all shortcuts, shortcuts for the current macOS app, or shortcuts for the current supported browser page. Apply is available only with a verified execution target and executable bindings. Failures stop execution without automatic retries.

```bash
npm ci
npm test -- --runInBand
npm run test:types
npm run lint
npm run build
npm run dev
```

Development/build requires macOS and the Raycast toolchain. To preview a local catalog, start the website, then run `npm run dev:catalog -- --origin http://localhost:3000`. Build and publish reject an active catalog override. See [contribution instructions](../CONTRIBUTING.md).

Accounts use public-client PKCE and Clerk. Account actions expose connect/disconnect and retry within a command; Raycast also provides native OAuth logout. Public catalog browsing remains usable when private synchronization fails. See [auth operations](../docs/auth-operations.md) for token modes, test scenarios, and rollout order.
