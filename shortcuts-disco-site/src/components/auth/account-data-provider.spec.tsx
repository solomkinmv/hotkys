import { useEffect } from "react";
import { jest, it, expect, beforeEach } from "@jest/globals";
import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
const mockAuth = { user: { id: "a" } as { id: string } | null };
const mockUser = { getPreferences: jest.fn<() => Promise<typeof prefs>>(), getProfile: jest.fn<(user: { id: string }) => Promise<{ id: string } | null>>(), updatePreferences: jest.fn<(next: typeof prefs, user: { id: string }) => Promise<void>>(), updateProfile: jest.fn() };
const mockCustom = { getAllCustomizations: jest.fn<() => Promise<unknown>>() };
const mockFavorites = { getFavorites: jest.fn<() => Promise<unknown>>(), addFavorite: jest.fn(), removeFavorite: jest.fn() };
jest.mock("./auth-provider", () => ({ useAuth: () => mockAuth }));
jest.mock("@/lib/services/user-service", () => ({ userService: mockUser }));
jest.mock("@/lib/services/customizations-service", () => ({ customizationsService: mockCustom }));
jest.mock("@/lib/services/favorites-service", () => ({ favoritesService: mockFavorites }));
const { AccountDataProvider, useAccountData } = require("./account-data-provider") as typeof import("./account-data-provider");
let account: ReturnType<typeof useAccountData>;
function Probe() { const value = useAccountData(); useEffect(() => { account = value; }, [value]); return <div data-testid="snapshot">{JSON.stringify({ data: value.data, loading: value.loading, errors: value.errors })}</div>; }
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (reason: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const prefs = { platformFilter: null, viewMode: "list", columnCount: 4 };
beforeEach(() => {
  jest.resetAllMocks(); mockAuth.user = { id: "a" };
  mockUser.getPreferences.mockResolvedValue(prefs);
  mockUser.getProfile.mockImplementation(async (user: { id: string }) => ({ id: user.id }));
  mockUser.updatePreferences.mockResolvedValue(undefined);
  mockCustom.getAllCustomizations.mockResolvedValue({ customApps: [], customKeymaps: [], shortcuts: [], favorites: [] });
  mockFavorites.getFavorites.mockResolvedValue([]);
});
it("completes loads during StrictMode effect replay", async () => {
  render(<StrictMode><AccountDataProvider><Probe /></AccountDataProvider></StrictMode>);
  await waitFor(() => expect(account.loading).toBe(false));
  expect(account.data.profile?.id).toBe("a");
});
it.each(["b", null, "a"])("discards an old session result when replacing it with %s", async next => {
  const old = deferred<{ id: string }>(); mockUser.getProfile.mockReturnValueOnce(old.promise);
  const view = render(<AccountDataProvider key="first"><Probe /></AccountDataProvider>);
  mockAuth.user = next ? { id: next } : null;
  view.rerender(<AccountDataProvider key="replacement"><Probe /></AccountDataProvider>);
  await waitFor(() => expect(account.loading).toBe(false));
  await act(async () => old.resolve({ id: "late-old" }));
  expect(account.data.profile?.id ?? null).toBe(next);
});
it("discards late failures after switching accounts", async () => {
  const old = deferred<null>(); mockUser.getProfile.mockReturnValueOnce(old.promise);
  const view = render(<AccountDataProvider key="a"><Probe /></AccountDataProvider>);
  mockAuth.user = { id: "b" }; view.rerender(<AccountDataProvider key="b"><Probe /></AccountDataProvider>);
  await act(async () => old.reject(new Error("A failed late")));
  await waitFor(() => expect(account.loading).toBe(false));
  expect(account.errors.profile).toBeUndefined();
});
it("serializes preference writes and waits before a refresh can replace pending edits", async () => {
  const save = deferred<void>(); let server = { ...prefs };
  mockUser.getPreferences.mockImplementation(async () => server);
  mockUser.updatePreferences.mockImplementationOnce(async next => { await save.promise; server = next; });
  render(<AccountDataProvider><Probe /></AccountDataProvider>);
  await waitFor(() => expect(account.loading).toBe(false));
  let operation!: Promise<void>; let refresh!: Promise<void>;
  act(() => { operation = account.updatePreferences({ columnCount: 6 }); });
  act(() => { refresh = account.refetch(); });
  expect(account.data.preferences.columnCount).toBe(6);
  await act(async () => { save.resolve(); await operation; await refresh; });
  expect(account.data.preferences.columnCount).toBe(6);
  expect(mockUser.updatePreferences).toHaveBeenCalledWith({ ...prefs, columnCount: 6 }, { id: "a" });
});
it("retries a failed preference read without writing defaults", async () => {
  mockUser.getPreferences.mockRejectedValueOnce(new Error("Read failed"));
  render(<AccountDataProvider><Probe /></AccountDataProvider>);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(account.errors.preferences).toBeUndefined());
  expect(mockUser.updatePreferences).not.toHaveBeenCalled();
});
it("keeps a failed preference save visible and retryable", async () => {
  mockUser.updatePreferences.mockRejectedValueOnce(new Error("Save failed"));
  render(<AccountDataProvider><Probe /></AccountDataProvider>);
  await waitFor(() => expect(account.loading).toBe(false));
  await act(async () => { await expect(account.updatePreferences({ columnCount: 6 })).rejects.toThrow("Save failed"); });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(account.errors.preferences).toBeUndefined());
  expect(mockUser.updatePreferences).toHaveBeenLastCalledWith({ ...prefs, columnCount: 6 }, { id: "a" });
});
