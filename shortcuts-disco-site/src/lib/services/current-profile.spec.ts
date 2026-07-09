import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "@/lib/auth/types";

const mockCreateClientOrNull = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  __esModule: true,
  createClientOrNull: mockCreateClientOrNull,
}));

const {
  clearCurrentProfileCache,
  getCurrentProfile,
} = require("./current-profile") as typeof import("./current-profile");

interface DeferredProfile {
  promise: Promise<{
    data: Record<string, string | null>;
    error: null;
  }>;
  resolve: (value: {
    data: Record<string, string | null>;
    error: null;
  }) => void;
}

function createDeferredProfile(): DeferredProfile {
  let resolve!: DeferredProfile["resolve"];
  const promise = new Promise<{
    data: Record<string, string | null>;
    error: null;
  }>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

function makeProfile(clerkUserId: string) {
  return {
    id: `profile-${clerkUserId}`,
    clerk_user_id: clerkUserId,
    display_name: clerkUserId,
    avatar_url: null,
    created_at: "2026-07-09T00:00:00.000Z",
  };
}

describe("current profile cache", () => {
  beforeEach(() => {
    clearCurrentProfileCache();
  });

  it("does not share in-flight profile requests across Clerk users", async () => {
    const deferredProfiles = new Map<string, DeferredProfile>();
    const supabase = {
      from: jest.fn(() => {
        const query = {
          clerkUserId: "",
          select: jest.fn(() => query),
          eq: jest.fn((_column: string, value: string) => {
            query.clerkUserId = value;
            return query;
          }),
          maybeSingle: jest.fn(() => {
            const deferred = createDeferredProfile();
            deferredProfiles.set(query.clerkUserId, deferred);
            return deferred.promise;
          }),
        };
        return query;
      }),
    };

    mockCreateClientOrNull.mockReturnValue(supabase);

    const firstUser: AuthUser = {
      id: "user-1",
      email: "user-1@example.com",
      displayName: "User One",
      avatarUrl: null,
    };
    const secondUser: AuthUser = {
      id: "user-2",
      email: "user-2@example.com",
      displayName: "User Two",
      avatarUrl: null,
    };

    const firstProfilePromise = getCurrentProfile(firstUser);
    const secondProfilePromise = getCurrentProfile(secondUser);

    deferredProfiles.get("user-2")?.resolve({
      data: makeProfile("user-2"),
      error: null,
    });
    deferredProfiles.get("user-1")?.resolve({
      data: makeProfile("user-1"),
      error: null,
    });

    await expect(firstProfilePromise).resolves.toMatchObject({
      clerkUserId: "user-1",
    });
    await expect(secondProfilePromise).resolves.toMatchObject({
      clerkUserId: "user-2",
    });
  });
});
