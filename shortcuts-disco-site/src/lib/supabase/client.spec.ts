import { jest, it, expect, beforeEach } from "@jest/globals";
const mockCreate = jest.fn((url: string, key: string, options: { accessToken(): Promise<string | null>; global: { fetch: typeof fetch } }) => options);
jest.mock("@supabase/supabase-js", () => ({ createClient: mockCreate }));
jest.mock("./config", () => ({ isSupabaseConfigured: () => true, getSupabaseConfig: () => ({ supabaseUrl: "https://example.supabase.co", supabaseKey: "public" }) }));
const { createClient, bindAuthUser, setSupabaseAccessTokenProvider } = require("./client") as typeof import("./client");
const user = { id: "a", email: null, displayName: null, avatarUrl: null };
it("does not dispatch A payload with B credentials when token resolution is delayed", async () => {
  let finish!: (token: string) => void;
  setSupabaseAccessTokenProvider(() => new Promise(resolve => { finish = resolve; })); bindAuthUser(user);
  createClient(user);
  const options = mockCreate.mock.calls.at(-1)![2];
  const token = options.accessToken();
  setSupabaseAccessTokenProvider(async () => "B-token"); bindAuthUser({ ...user, id: "b" });
  finish("A-token");
  await expect(token).rejects.toThrow("Session changed");
  expect(() => options.global.fetch("https://example.supabase.co", { method: "POST", body: "A payload" })).toThrow("Session changed");
  expect(() => createClient(user)).toThrow("Session changed");
});
