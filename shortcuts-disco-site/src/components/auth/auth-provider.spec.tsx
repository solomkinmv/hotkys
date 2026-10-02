import { beforeEach, expect, it, jest } from "@jest/globals";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import type { AuthUser } from "@/lib/auth/types";

const mockSignOut = jest.fn<(options: { redirectUrl: string }) => Promise<void>>();
const mockSetToken = jest.fn();
const mockSetUser = jest.fn<(user: AuthUser | null) => void>();
const mockClearProfile = jest.fn();
const firstUser = { id: "user_a", primaryEmailAddress: null, fullName: "A", imageUrl: "" };
const firstSession = { id: "session_a", getToken: async () => "token_a" };
let mockUser: typeof firstUser | null;
let mockSession: typeof firstSession | null;
jest.mock("@clerk/react", () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  useClerk: () => ({ signOut: mockSignOut }),
  useUser: () => ({ isLoaded: true, user: mockUser }),
  useSession: () => ({ isLoaded: true, session: mockSession }),
}));
jest.mock("@/lib/clerk/config", () => ({ getClerkPublishableKey: () => "pk_test_fixture", isClerkConfigured: () => true }));
jest.mock("@/lib/supabase/client", () => ({ setSupabaseAccessTokenProvider: mockSetToken, bindAuthUser: jest.fn() }));
jest.mock("@/lib/auth/session", () => ({ setCurrentAuthUser: mockSetUser }));
jest.mock("@/lib/services/current-profile", () => ({ clearCurrentProfileCache: mockClearProfile }));
jest.mock("./account-data-provider", () => ({ AccountDataProvider: ({ children }: { children: ReactNode }) => children }));
const { AuthProvider, useAuth } = require("./auth-provider") as typeof import("./auth-provider");
let auth: ReturnType<typeof useAuth>;
function Probe() {
  const current = useAuth();
  useEffect(() => { auth = current; }, [current]);
  return <div>{current.isLoading ? "loading" : current.user?.id ?? "signed out"}</div>;
}
beforeEach(() => { jest.clearAllMocks(); mockUser = firstUser; mockSession = firstSession; });

it("keeps the existing bridge usable when Clerk rejects without changing its session", async () => {
  mockSignOut.mockRejectedValueOnce(new Error("Sign-out rejected"));
  render(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText("user_a");
  const token = mockSetToken.mock.calls.at(-1)?.[0];
  const clears = mockClearProfile.mock.calls.length;
  await act(async () => { await expect(auth.signOut()).rejects.toThrow("Sign-out rejected"); });
  expect(auth.isLoading).toBe(false);
  expect(auth.user?.id).toBe("user_a");
  expect(mockSetToken.mock.calls.at(-1)?.[0]).toBe(token);
  expect(mockClearProfile).toHaveBeenCalledTimes(clears);
});

it("clears the bridge and cached profile when Clerk emits signed-out state", async () => {
  mockSignOut.mockImplementationOnce(async () => { mockUser = null; mockSession = null; });
  const view = render(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText("user_a");
  await act(async () => { await auth.signOut(); });
  view.rerender(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText("signed out");
  expect(mockSetToken).toHaveBeenLastCalledWith(null);
  expect(mockSetUser).toHaveBeenLastCalledWith(null);
  expect(mockClearProfile).toHaveBeenCalled();
});

it("does not restore an old account when a delayed sign-out fails after an account switch", async () => {
  let reject!: (error: Error) => void;
  mockSignOut.mockReturnValueOnce(new Promise<void>((_, fail) => { reject = fail; }));
  const view = render(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText("user_a");
  const result = auth.signOut().catch(error => error);
  mockUser = { ...firstUser, id: "user_b" };
  mockSession = { id: "session_b", getToken: async () => "token_b" };
  view.rerender(<AuthProvider><Probe /></AuthProvider>);
  await screen.findByText("user_b");
  await act(async () => { reject(new Error("Late failure")); await result; });
  await waitFor(() => expect(auth.user?.id).toBe("user_b"));
  expect(mockSetUser.mock.calls.at(-1)?.[0]?.id).toBe("user_b");
});
