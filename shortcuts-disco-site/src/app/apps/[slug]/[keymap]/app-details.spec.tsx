import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type {
  AppShortcuts,
  Keymap,
} from "@/lib/model/internal/internal-models";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUsePreferences = jest.fn();
const mockUseFavorites = jest.fn();
const mockUseCustomizations = jest.fn();

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

jest.mock("@/lib/hooks/use-favorites", () => ({
  __esModule: true,
  useFavorites: mockUseFavorites,
}));

jest.mock("@/lib/hooks/use-customizations", () => ({
  __esModule: true,
  useCustomizations: mockUseCustomizations,
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
    mockUseFavorites.mockReturnValue({
      favorites: [],
      isLoading: false,
      isFavorite: jest.fn(),
      toggleFavorite: jest.fn(),
      refetch: jest.fn(),
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: [],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
      refetch: jest.fn(),
    });
    mockUsePreferences.mockReturnValue({
      preferences: {
        platformFilter: null,
        viewMode: "list",
        columnCount: 4,
      },
      isLoading: false,
      updatePreferences: jest.fn(),
      refetch: jest.fn(),
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

  it("renders favorite shortcuts as the first shortcut section", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "favorite-1",
          userId: "user-1",
          itemType: "shortcut",
          appSlug: "sample",
          keymapTitle: "Default",
          sectionTitle: "Editing",
          shortcutTitle: "Copy",
        },
        {
          id: "favorite-2",
          userId: "user-1",
          itemType: "shortcut",
          appSlug: "sample",
          keymapTitle: "Other",
          sectionTitle: "Editing",
          shortcutTitle: "Copy",
        },
      ],
      isLoading: false,
      isFavorite: jest.fn(),
      toggleFavorite: jest.fn(),
      refetch: jest.fn(),
    });

    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.queryByRole("region", {
      name: "Favorite shortcuts",
    })).toBeNull();

    const favoriteLabels = screen.getAllByText("Favorite shortcuts");
    const editingLabels = screen.getAllByText("Editing");
    const favoriteSection = favoriteLabels[favoriteLabels.length - 1];
    const editingSection = editingLabels[editingLabels.length - 1];

    expect(
      favoriteSection.compareDocumentPosition(editingSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByText("Copy")).toHaveLength(2);
    expect(screen.getAllByText("Shortcut")).toHaveLength(2);
  });

  it("renders account-local shortcuts inside matching official sections", () => {
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: [
          {
            id: "keymap-1",
            baseAppSlug: "sample",
            title: "Default",
            sections: [
              {
                id: "section-1",
                keymapId: "keymap-1",
                title: "Editing",
                sortOrder: 0,
                shortcuts: [
                  {
                    id: "shortcut-1",
                    sectionId: "section-1",
                    title: "Paste",
                    key: "cmd+v",
                    comment: "Local only",
                    isDeleted: false,
                    sortOrder: 0,
                  },
                ],
              },
            ],
          },
        ],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.getByText("Paste")).toBeTruthy();
    expect(screen.getByText("Local only")).toBeTruthy();
    expect(screen.getAllByText("Shortcut")).toHaveLength(2);
  });

  it("keeps the add shortcut control inline with the section heading", () => {
    render(<AppDetails application={application} keymap={keymap} />);

    const addShortcutButton = screen.getByLabelText("Add shortcut to Editing");

    expect(addShortcutButton.className).not.toContain("absolute");
    expect(addShortcutButton.className).toContain("ml-1");
  });
});
