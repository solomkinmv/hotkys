import { describe, expect, it } from "@jest/globals";
import { getLoginHref, getSafeAuthRedirectPath } from "./redirect";

describe("auth redirects", () => {
  it("keeps safe app-local redirect paths", () => {
    expect(getSafeAuthRedirectPath("/favorites")).toBe("/favorites");
    expect(getSafeAuthRedirectPath("/apps/slack/default?tab=mine")).toBe(
      "/apps/slack/default?tab=mine"
    );
  });

  it("rejects external and auth-page redirect targets", () => {
    expect(getSafeAuthRedirectPath("https://example.com")).toBe("/");
    expect(getSafeAuthRedirectPath("//example.com")).toBe("/");
    expect(getSafeAuthRedirectPath("/auth/login")).toBe("/");
    expect(getSafeAuthRedirectPath("/auth/callback?code=abc")).toBe("/");
  });

  it("does not preserve auth pages in login links", () => {
    expect(getLoginHref("/favorites")).toBe("/auth/login?next=%2Ffavorites");
    expect(getLoginHref("/auth/login")).toBe("/auth/login");
  });
});
