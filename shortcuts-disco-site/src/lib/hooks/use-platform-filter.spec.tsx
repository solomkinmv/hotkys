import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import type { UserPreferences } from "@/lib/model/user/user-models";

const mockUseAuth = jest.fn();
const mockGetPreferences = jest.fn<() => Promise<UserPreferences | null>>();
const mockUpdatePreferences = jest.fn<() => Promise<void>>();
const mockUserService = {
  getPreferences: mockGetPreferences,
  updatePreferences: mockUpdatePreferences,
};

jest.mock("@/components/auth/auth-provider", () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}));

jest.mock("@/lib/services/user-service", () => ({
  __esModule: true,
  userService: mockUserService,
}));

const { AccountDataProvider } = require("@/components/auth/account-data-provider") as typeof import("@/components/auth/account-data-provider");
const { usePlatformFilter } = require("./use-platform-filter") as typeof import("./use-platform-filter");

function PlatformFilterProbe() {
  const { platformFilter } = usePlatformFilter();
  return <span>{platformFilter ?? "all"}</span>;
}

describe("usePlatformFilter", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      user: { id: "user-1" },
    });
    mockGetPreferences.mockResolvedValue({
      platformFilter: "linux",
      viewMode: "list",
      columnCount: 4,
    });
  });

  it("uses the authenticated user's saved platform preference", async () => {
    render(<AccountDataProvider><PlatformFilterProbe /></AccountDataProvider>);

    await waitFor(() => {
      expect(screen.getByText("linux")).toBeTruthy();
    });
  });
});
