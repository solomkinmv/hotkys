import { OAuth } from "@raycast/api";
import { CLERK_AUTHORIZATION_ENDPOINT, CLERK_OAUTH_CLIENT_ID, CLERK_OAUTH_SCOPE, CLERK_TOKEN_ENDPOINT } from "./config";
import { resolveAccessToken } from "./session-manager";
import { exchangeAuthorizationCode, refreshAccessToken, type TokenResponse } from "./token-exchange";

const oauthClient = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Hotkys",
  providerId: "hotkys-clerk",
  description: "Connect your Hotkys account to sync favorites and custom shortcuts.",
});

export async function getAccessToken(allowAuthorization: boolean): Promise<string | null> {
  return resolveAccessToken({
    store: oauthClient,
    refresh: (refreshToken) =>
      refreshAccessToken({
        endpoint: CLERK_TOKEN_ENDPOINT,
        clientId: CLERK_OAUTH_CLIENT_ID,
        refreshToken,
      }),
    authorize: authorizeWithClerk,
    allowAuthorization,
  });
}

export async function signOut(): Promise<void> {
  await oauthClient.removeTokens();
}

async function authorizeWithClerk(): Promise<TokenResponse> {
  if (CLERK_OAUTH_CLIENT_ID === "configure-in-clerk-dashboard") {
    throw new Error("The Hotkys OAuth application is not configured yet.");
  }

  const request = await oauthClient.authorizationRequest({
    endpoint: CLERK_AUTHORIZATION_ENDPOINT,
    clientId: CLERK_OAUTH_CLIENT_ID,
    scope: CLERK_OAUTH_SCOPE,
  });
  const response = await oauthClient.authorize(request);

  return exchangeAuthorizationCode({
    endpoint: CLERK_TOKEN_ENDPOINT,
    clientId: CLERK_OAUTH_CLIENT_ID,
    authorizationCode: response.authorizationCode,
    codeVerifier: request.codeVerifier,
    redirectUri: request.redirectURI,
  });
}
