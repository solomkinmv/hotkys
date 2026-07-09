import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  AppShortcuts,
  Keymap,
} from "@/lib/model/internal/internal-models";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUsePreferences = jest.fn();
const mockUseFavorites = jest.fn();
const mockUseCustomizations = jest.fn();
const createBaseAppShortcutMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const upsertShortcutOverlayMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();
const updateCustomShortcutMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();
const deleteCustomShortcutMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();

jest.mock("next/navigation", () => ({
  __esModule: true,
  usePathname: () => "/apps/sample/default",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/favorites/favorite-button", () => ({
  __esModule: true,
  FavoriteButton: ({ itemType }: { itemType: string }) => (
    <span data-testid={`favorite-${itemType}`} />
  ),
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

jest.mock("@/lib/services/customizations-service", () => ({
  __esModule: true,
  customizationsService: {
    createBaseAppShortcut: createBaseAppShortcutMock,
    upsertShortcutOverlay: upsertShortcutOverlayMock,
    updateCustomShortcut: updateCustomShortcutMock,
    deleteCustomShortcut: deleteCustomShortcutMock,
  },
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
    Object.defineProperty(window.HTMLElement.prototype, "hasPointerCapture", {
      configurable: true,
      value: () => false,
    });
    localStorage.clear();
    replaceMock.mockClear();
    createBaseAppShortcutMock.mockReset();
    createBaseAppShortcutMock.mockResolvedValue({});
    upsertShortcutOverlayMock.mockReset();
    upsertShortcutOverlayMock.mockResolvedValue(undefined);
    updateCustomShortcutMock.mockReset();
    updateCustomShortcutMock.mockResolvedValue(undefined);
    deleteCustomShortcutMock.mockReset();
    deleteCustomShortcutMock.mockResolvedValue(undefined);
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

  it("does not render a keymap favorite control near view switching", () => {
    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.queryByTestId("favorite-keymap")).toBeNull();
    expect(screen.getByTestId("favorite-shortcut")).toBeTruthy();
    expect(screen.getByLabelText("List view")).toBeTruthy();
    expect(screen.getByLabelText("Cheat sheet view")).toBeTruthy();
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

    const commentContainer = screen.getByText("Local only").parentElement;
    expect(
      commentContainer?.querySelector('[data-customization-status="created"]'),
    ).not.toBeNull();
    expect(commentContainer?.textContent).toBe("Local only");
  });

  it("marks changed and created shortcuts with right-side icon labels", () => {
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
                    isDeleted: false,
                    sortOrder: 0,
                  },
                ],
              },
            ],
          },
        ],
        shortcuts: [
          {
            baseKey: "sample:Default:Editing:Copy",
            modification: {
              id: "overlay-1",
              title: "Duplicate",
              key: "cmd+d",
              isDeleted: false,
              sortOrder: 0,
            },
          },
        ],
        favorites: [],
      },
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.queryByText("Changed")).toBeNull();
    expect(screen.queryByText("Created")).toBeNull();
    expect(screen.queryByText("Edited")).toBeNull();
    expect(screen.queryByText("Custom")).toBeNull();
    expect(screen.getByLabelText("Edited shortcut")).toBeTruthy();
    expect(screen.getByLabelText("Custom shortcut")).toBeTruthy();
    expect(document.querySelector(".rounded-full")).toBeNull();
  });

  it("renders the add shortcut action beside search instead of section headings", () => {
    render(<AppDetails application={application} keymap={keymap} />);

    const addShortcutButton = screen.getByRole("button", {
      name: "Add shortcut",
    });
    const searchActions = screen.getByRole("search", {
      name: "Search shortcuts",
    });

    expect(searchActions.contains(addShortcutButton)).toBe(true);
    expect(
      screen.queryByRole("button", { name: "Add shortcut to Editing" }),
    ).toBeNull();
    expect(addShortcutButton.className).toContain("bg-secondary");
    expect(addShortcutButton.textContent).toContain("Add shortcut");

    fireEvent.click(addShortcutButton);

    const sectionSelect = screen.getByRole("combobox", { name: "Section" });
    expect(sectionSelect.textContent).toContain("Editing");
  });

  it("opens shortcut customization when an authenticated user clicks a shortcut", () => {
    render(<AppDetails application={application} keymap={keymap} />);

    expect(
      screen.queryByRole("button", { name: "Edit shortcuts" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Customize Copy" }),
    ).toBeNull();

    fireEvent.click(screen.getByText("Copy"));

    expect(
      screen.getByRole("dialog", { name: "Customize Shortcut" }),
    ).toBeTruthy();
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe(
      "Copy",
    );
  });

  it("updates created custom shortcuts from the shortcut dialog", async () => {
    const refetch = jest.fn<() => Promise<void>>();
    refetch.mockResolvedValue(undefined);
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
      refetch,
    });

    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.queryByRole("button", { name: "Delete Paste" })).toBeNull();

    fireEvent.click(screen.getByText("Paste"));

    expect(
      screen.getByRole("dialog", { name: "Customize Shortcut" }),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Paste special" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateCustomShortcutMock).toHaveBeenCalledWith(
        "shortcut-1",
        {
          title: "Paste special",
          key: "ctrl+v",
          comment: undefined,
        },
        { id: "user-1" },
      ),
    );
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it("deletes created custom shortcuts from the shortcut dialog", async () => {
    const refetch = jest.fn<() => Promise<void>>();
    refetch.mockResolvedValue(undefined);
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
      refetch,
    });

    render(<AppDetails application={application} keymap={keymap} />);

    expect(screen.queryByRole("button", { name: "Delete Paste" })).toBeNull();

    fireEvent.click(screen.getByText("Paste"));
    fireEvent.click(screen.getByRole("button", { name: "Delete shortcut" }));

    expect(screen.getByRole("dialog", { name: "Delete Shortcut" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(deleteCustomShortcutMock).toHaveBeenCalledWith("shortcut-1", {
        id: "user-1",
      }),
    );
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it("adds shortcuts to a new custom section", async () => {
    render(<AppDetails application={application} keymap={keymap} />);

    fireEvent.click(screen.getByRole("button", { name: "Add shortcut" }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Section" }), {
      key: "ArrowDown",
    });
    fireEvent.click(screen.getByRole("option", { name: "New section..." }));

    const sectionControls = screen.getByRole("group", { name: "Section" });
    expect(
      sectionControls.contains(screen.getByLabelText("Section name")),
    ).toBe(true);
    expect(sectionControls.className).toContain("sm:grid-cols");

    fireEvent.change(screen.getByLabelText("Section name"), {
      target: { value: "Navigation" },
    });
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Jump to file" },
    });
    fireEvent.change(screen.getByLabelText("Keys"), {
      target: { value: "cmd+j" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createBaseAppShortcutMock).toHaveBeenCalledWith(
        {
          baseAppSlug: "sample",
          keymapTitle: "Default",
          sectionTitle: "Navigation",
          title: "Jump to file",
          key: "cmd+j",
          comment: undefined,
        },
        { id: "user-1" },
      ),
    );
  });

  it("normalizes clear shortcut key fixes before saving", async () => {
    render(<AppDetails application={application} keymap={keymap} />);

    fireEvent.click(screen.getByRole("button", { name: "Add shortcut" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Undo" },
    });
    fireEvent.change(screen.getByLabelText("Keys"), {
      target: { value: "cmd+z+shift" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createBaseAppShortcutMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Undo",
          key: "shift+cmd+z",
        }),
        { id: "user-1" },
      ),
    );
  });

  it("offers shortcut modifier builder controls and format help", () => {
    render(<AppDetails application={application} keymap={keymap} />);

    fireEvent.click(screen.getByRole("button", { name: "Add shortcut" }));
    fireEvent.click(screen.getByRole("button", { name: "Add cmd modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Add shift modifier" }));

    expect((screen.getByLabelText("Keys") as HTMLInputElement).value).toBe(
      "shift+cmd+",
    );
    expect(
      screen.getByRole("button", { name: "Shortcut key format" }),
    ).toBeTruthy();
  });
});
