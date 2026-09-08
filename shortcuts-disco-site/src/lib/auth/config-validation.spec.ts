import { describe, expect, it } from "@jest/globals";
import { validateAuthConfig, productionAuth } from "./config-validation";
const testConfig = { clerkKey: `pk_test_${btoa("sample.clerk.accounts.dev$")}`, supabaseUrl: "https://test-project.supabase.co", supabaseKey: "sb_publishable_public" };
describe("auth configuration modes", () => {
  it("permits fully public builds and requires complete account configuration", () => {
    expect(validateAuthConfig({}, "public")).toBe("public");
    expect(() => validateAuthConfig({ clerkKey: testConfig.clerkKey }, "auto")).toThrow("requires");
    expect(() => validateAuthConfig(testConfig, "public")).toThrow("unset");
  });
  it("separates test and production projects and rejects secret keys", () => {
    expect(validateAuthConfig(testConfig, "test")).toBe("test");
    expect(() => validateAuthConfig({ ...testConfig, supabaseUrl: productionAuth.supabaseUrl }, "test")).toThrow("dedicated");
    expect(() => validateAuthConfig({ ...testConfig, supabaseKey: "sb_secret_private" }, "test")).toThrow("secret");
    expect(() => validateAuthConfig(testConfig, "production")).toThrow("match");
    expect(validateAuthConfig({ ...testConfig, clerkKey: `pk_live_${btoa("clerk.hotkys.com$")}`, supabaseUrl: productionAuth.supabaseUrl }, "production")).toBe("production");
  });
});
