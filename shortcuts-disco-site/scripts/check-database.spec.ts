/** @jest-environment node */
import { beforeEach, expect, it, jest } from "@jest/globals";

const mockLimit = jest.fn<() => Promise<{ error: { code: string } | null }>>();
const mockSelect = jest.fn(() => ({ limit: mockLimit }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockCreateClient = jest.fn<(url: string, key: string, options: unknown) => { from: typeof mockFrom }>(() => ({ from: mockFrom }));
jest.mock("@supabase/supabase-js", () => ({ createClient: mockCreateClient }));
const { checkDatabaseSchema } = require("./check-database") as typeof import("./check-database");
const config = { supabaseUrl: "https://test.supabase.co", supabaseKey: "sb_publishable_test" };

beforeEach(() => { jest.clearAllMocks(); mockLimit.mockResolvedValue({ error: null }); });

it("checks every required column with zero-row requests and no stored session", async () => {
  await checkDatabaseSchema(config);
  expect(mockCreateClient).toHaveBeenCalledWith(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  expect(mockFrom.mock.calls).toEqual([["favorites"], ["custom_shortcuts"], ["custom_keymaps"]]);
  expect(mockSelect.mock.calls).toEqual([["custom_keymap_id,custom_shortcut_id"], ["key_is_cleared,comment_is_cleared"], ["sort_order"]]);
  expect(mockLimit.mock.calls).toEqual([[0], [0], [0]]);
});

it.each(["42703", "PGRST204", "42501"])("blocks deployment on API failure %s without printing credentials", async code => {
  mockLimit.mockResolvedValueOnce({ error: { code } });
  await expect(checkDatabaseSchema(config)).rejects.toThrow(`Database schema check failed for favorites (${code})`);
  expect(mockFrom).toHaveBeenCalledTimes(1);
});
