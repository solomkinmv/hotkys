import { resolveAccessToken, type StoredTokenSet, type TokenStore } from "./session-manager";
import type { TokenResponse } from "./token-exchange";

function storedToken(overrides: Partial<StoredTokenSet> = {}): StoredTokenSet {
  return {
    accessToken: "stored-access-token",
    refreshToken: "stored-refresh-token",
    isExpired: () => false,
    ...overrides,
  };
}

function tokenStore(tokens?: StoredTokenSet): TokenStore {
  return {
    getTokens: jest.fn(async () => tokens),
    setTokens: jest.fn(async () => undefined),
    removeTokens: jest.fn(async () => undefined),
  };
}

describe("OAuth session manager", () => {
  it("reuses a valid stored access token", async () => {
    const store = tokenStore(storedToken());
    const refresh = jest.fn();
    const authorize = jest.fn();

    await expect(resolveAccessToken({ store, refresh, authorize, allowAuthorization: true })).resolves.toBe(
      "stored-access-token"
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(authorize).not.toHaveBeenCalled();
  });

  it("silently returns no token when authorization is optional", async () => {
    const store = tokenStore();
    const authorize = jest.fn();

    await expect(
      resolveAccessToken({
        store,
        refresh: jest.fn(),
        authorize,
        allowAuthorization: false,
      })
    ).resolves.toBeNull();
    expect(authorize).not.toHaveBeenCalled();
  });

  it("authorizes when a private command requires a session", async () => {
    const store = tokenStore();
    const authorized: TokenResponse = {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      expires_in: 3600,
    };

    await expect(
      resolveAccessToken({
        store,
        refresh: jest.fn(),
        authorize: jest.fn(async () => authorized),
        allowAuthorization: true,
      })
    ).resolves.toBe("new-access-token");
    expect(store.setTokens).toHaveBeenCalledWith(authorized);
  });

  it("refreshes expired tokens and stores the replacement", async () => {
    const store = tokenStore(storedToken({ isExpired: () => true }));
    const refreshed: TokenResponse = {
      access_token: "refreshed-access-token",
      refresh_token: "rotated-refresh-token",
      expires_in: 3600,
    };

    await expect(
      resolveAccessToken({
        store,
        refresh: jest.fn(async () => refreshed),
        authorize: jest.fn(),
        allowAuthorization: false,
      })
    ).resolves.toBe("refreshed-access-token");
    expect(store.setTokens).toHaveBeenCalledWith(refreshed);
  });

  it("removes an unusable expired session without prompting optional commands", async () => {
    const store = tokenStore(storedToken({ isExpired: () => true, refreshToken: undefined }));

    await expect(
      resolveAccessToken({
        store,
        refresh: jest.fn(),
        authorize: jest.fn(),
        allowAuthorization: false,
      })
    ).resolves.toBeNull();
    expect(store.removeTokens).toHaveBeenCalledTimes(1);
  });

  it("reauthorizes a required command after refresh fails", async () => {
    const store = tokenStore(storedToken({ isExpired: () => true }));
    const authorized: TokenResponse = {
      access_token: "reauthorized-access-token",
      refresh_token: "reauthorized-refresh-token",
    };

    await expect(
      resolveAccessToken({
        store,
        refresh: jest.fn(async () => {
          throw new Error("invalid_grant");
        }),
        authorize: jest.fn(async () => authorized),
        allowAuthorization: true,
      })
    ).resolves.toBe("reauthorized-access-token");
    expect(store.removeTokens).toHaveBeenCalledTimes(1);
    expect(store.setTokens).toHaveBeenCalledWith(authorized);
  });
});
