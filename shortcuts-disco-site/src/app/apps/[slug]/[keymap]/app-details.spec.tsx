import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type {
  AppShortcuts,
  Keymap,
} from "@/lib/model/internal/internal-models";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUsePreferences = jest.fn();

jest.mock("next/navigation", () => ({
  __esModule: true,
  usePathname: () => "/apps/sample/default",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/favorites/favorite-button", () => ({
  __esModule: true,
  FavoriteButton: () => null,
}));

jest.mock("@/components/ui/shortcut-display", () => ({
  __esModule: true,
  ShortcutDisplay: () => <span>Shortcut</span>,
}));

jest.mock("@/components/auth/auth-provider", () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}));

jest.mock("@/lib/hooks/use-preferences", () => ({
  __esModule: true,
  usePreferences: mockUsePreferences,
}));

const { AppDetails } = require("./app-details") as typeof import("./app-details");

const keymap: Keymap = {
  title: "Default",
  sections: [
    {
      title: "Editing",
      hotkeys: [
        {
          title: "Copy",
          sequence: [{ base: "C", modifiers: [] }],
        },
      ],
    },
  ],
};

const application: AppShortcuts = {
  name: "Sample",
  slug: "sample",
  keymaps: [keymap],
};

describe("AppDetails", () => {
  beforeEach(() => {
    localStorage.clear();
    replaceMock.mockClear();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
    })) as typeof IntersectionObserver;
    mockUseAuth.mockReturnValue({
      user: { id: "user-1" },
    });
  });

  it("uses saved authenticated display preferences when URL params are absent", () => {
    mockUsePreferences.mockReturnValue({
      preferences: {
        platformFilter: null,
        viewMode: "cheatsheet",
        columnCount: 2,
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      refetch: jest.fn(),
    });

    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.getByLabelText("Column settings")).toBeTruthy();
    expect(document.querySelector('[style*="640px"]')).not.toBeNull();
  });
});
