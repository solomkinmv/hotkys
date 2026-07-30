import type { TokenResponse } from "./token-exchange";

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

export async function resolveAccessToken({
  store,
  refresh,
  authorize,
  allowAuthorization,
}: ResolveAccessTokenOptions): Promise<string | null> {
  const storedTokens = await store.getTokens();

  if (storedTokens && !storedTokens.isExpired()) {
    return storedTokens.accessToken;
  }

  if (storedTokens?.refreshToken) {
    try {
      const refreshedTokens = await refresh(storedTokens.refreshToken);
      await store.setTokens(refreshedTokens);
      return refreshedTokens.access_token;
    } catch {
      await store.removeTokens();
    }
  } else if (storedTokens) {
    await store.removeTokens();
  }

  if (!allowAuthorization) {
    return null;
  }

  const authorizedTokens = await authorize();
  await store.setTokens(authorizedTokens);
  return authorizedTokens.access_token;
}
