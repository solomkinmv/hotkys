import { OAuthTokenError, type TokenResponse } from "./token-exchange";

export interface StoredTokenSet {
  accessToken: string;
  refreshToken?: string;
  isExpired(): boolean;
}

export interface TokenStore {
  getTokens(): Promise<StoredTokenSet | undefined>;
  setTokens(tokens: TokenResponse): Promise<void>;
  removeTokens(): Promise<void>;
}

interface ResolveAccessTokenOptions {
  store: TokenStore;
  refresh(refreshToken: string): Promise<TokenResponse>;
  authorize(): Promise<TokenResponse>;
  allowAuthorization: boolean;
}

// All hooks in a command share the same store. Keep refresh and interactive
// authorization separate so optional/background reads never trigger a prompt.
const pendingSessions = new WeakMap<TokenStore, Promise<string | null>>();
const pendingAuthorizations = new WeakMap<TokenStore, Promise<string>>();

function singleFlight<T>(
  pending: WeakMap<TokenStore, Promise<T>>,
  store: TokenStore,
  run: () => Promise<T>
): Promise<T> {
  const existing = pending.get(store);
  if (existing) return existing;
  const promise = run().finally(() => pending.delete(store));
  pending.set(store, promise);
  return promise;
}

export async function resolveAccessToken(options: ResolveAccessTokenOptions): Promise<string | null> {
  const { store, authorize, allowAuthorization } = options;
  const token = await singleFlight(pendingSessions, store, () => resolveStoredAccessToken(options));
  if (token || !allowAuthorization) return token;

  return singleFlight(pendingAuthorizations, store, async () => {
    const authorizedTokens = await authorize();
    await store.setTokens(authorizedTokens);
    return authorizedTokens.access_token;
  });
}

async function resolveStoredAccessToken({ store, refresh }: ResolveAccessTokenOptions): Promise<string | null> {
  const storedTokens = await store.getTokens();

  if (storedTokens && !storedTokens.isExpired()) {
    return storedTokens.accessToken;
  }

  if (storedTokens?.refreshToken) {
    let refreshedTokens: TokenResponse;
    try {
      refreshedTokens = await refresh(storedTokens.refreshToken);
    } catch (error) {
      // Only an explicit invalid grant proves the refresh credentials unusable.
      // Network, throttling, server, malformed-response and configuration errors
      // must remain retryable without signing the user out.
      if (!(error instanceof OAuthTokenError && error.code === "invalid_grant" && error.status === 400)) {
        throw error;
      }
      await store.removeTokens();
      return null;
    }
    await store.setTokens(refreshedTokens);
    return refreshedTokens.access_token;
  } else if (storedTokens) {
    await store.removeTokens();
  }

  return null;
}
