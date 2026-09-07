import { resolveAccessToken, type StoredTokenSet, type TokenStore } from "./session-manager";
import { refreshAccessToken, type TokenResponse } from "./token-exchange";

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
    setTokens: jest.fn(async (replacement: TokenResponse) => {
      tokens = storedToken({ accessToken: replacement.access_token, refreshToken: replacement.refresh_token });
    }),
    removeTokens: jest.fn(async () => {
      tokens = undefined;
    }),
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
        refresh: () =>
          refreshAccessToken(
            { endpoint: "https://example.com/token", clientId: "client", refreshToken: "expired" },
            async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })
          ),
        authorize: jest.fn(async () => authorized),
        allowAuthorization: true,
      })
    ).resolves.toBe("reauthorized-access-token");
    expect(store.removeTokens).toHaveBeenCalledTimes(1);
    expect(store.setTokens).toHaveBeenCalledWith(authorized);
  });

  it.each([false, true])(
    "preserves credentials on a network failure (authorization=%s)",
    async (allowAuthorization) => {
      const tokens = storedToken({ isExpired: () => true });
      const store = tokenStore(tokens);
      const error = new TypeError("fetch failed");
      const authorize = jest.fn();
      await expect(
        resolveAccessToken({
          store,
          authorize,
          allowAuthorization,
          refresh: async () => {
            throw error;
          },
        })
      ).rejects.toBe(error);
      expect(await store.getTokens()).toBe(tokens);
      expect(authorize).not.toHaveBeenCalled();
    }
  );

  it.each([429, 500, 503, 401])("preserves credentials after HTTP %s", async (status) => {
    const tokens = storedToken({ isExpired: () => true });
    const store = tokenStore(tokens);
    await expect(
      resolveAccessToken({
        store,
        authorize: jest.fn(),
        allowAuthorization: false,
        refresh: () =>
          refreshAccessToken(
            { endpoint: "https://example.com/token", clientId: "client", refreshToken: "refresh" },
            async () => new Response(JSON.stringify({ error: "temporarily_unavailable" }), { status })
          ),
      })
    ).rejects.toThrow();
    expect(await store.getTokens()).toBe(tokens);
  });

  it("shares one refresh between concurrent callers and reuses the replacement", async () => {
    const store = tokenStore(storedToken({ isExpired: () => true }));
    const refresh = jest.fn(async () => ({ access_token: "fresh", refresh_token: "replacement" }));
    const options = { store, refresh, authorize: jest.fn(), allowAuthorization: false };
    expect(await Promise.all([resolveAccessToken(options), resolveAccessToken(options)])).toEqual(["fresh", "fresh"]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await resolveAccessToken(options)).toBe("fresh");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shares refresh failures but lets the next request retry", async () => {
    const store = tokenStore(storedToken({ isExpired: () => true }));
    const error = new TypeError("offline");
    const refresh = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce({ access_token: "fresh" });
    const options = { store, refresh, authorize: jest.fn(), allowAuthorization: false };
    const results = await Promise.allSettled([resolveAccessToken(options), resolveAccessToken(options)]);
    expect(results).toEqual([
      { status: "rejected", reason: error },
      { status: "rejected", reason: error },
    ]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await resolveAccessToken(options)).toBe("fresh");
  });

  it("does not clear credentials when storing a successful refresh fails", async () => {
    const tokens = storedToken({ isExpired: () => true });
    const store = tokenStore(tokens);
    const error = new Error("storage unavailable");
    store.setTokens = async () => {
      throw error;
    };
    await expect(
      resolveAccessToken({
        store,
        refresh: async () => ({ access_token: "fresh" }),
        authorize: jest.fn(),
        allowAuthorization: false,
      })
    ).rejects.toBe(error);
    expect(await store.getTokens()).toBe(tokens);
  });

  it("coalesces required authorization without prompting optional callers", async () => {
    const store = tokenStore();
    const authorize = jest.fn(async () => ({ access_token: "authorized" }));
    const options = { store, refresh: jest.fn(), authorize, allowAuthorization: true };
    expect(
      await Promise.all([
        resolveAccessToken({ ...options, allowAuthorization: false }),
        resolveAccessToken(options),
        resolveAccessToken(options),
      ])
    ).toEqual([null, "authorized", "authorized"]);
    expect(authorize).toHaveBeenCalledTimes(1);
  });
});
