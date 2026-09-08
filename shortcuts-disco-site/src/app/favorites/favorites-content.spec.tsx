import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();
const mockUseFavorites = jest.fn();

jest.mock("@/components/auth/auth-provider", () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}));

jest.mock("@/lib/hooks/use-favorites", () => ({
  __esModule: true,
  useFavorites: mockUseFavorites,
}));

jest.mock("@/lib/hooks/use-customizations", () => ({ useCustomizations: () => ({ customizations: { customApps: [], customKeymaps: [], shortcuts: [], favorites: [] } }) }));

const { FavoritesContent } =
  require("./favorites-content") as typeof import("./favorites-content");

describe("FavoritesContent", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-1" },
      isLoading: false,
    });
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "favorite-app",
          userId: "user-1",
          itemType: "app",
          appSlug: "sample",
        },
        {
          id: "favorite-keymap",
          userId: "user-1",
          itemType: "keymap",
          appSlug: "sample",
          keymapTitle: "Default",
        },
      ],
      isLoading: false,
      toggleFavorite: jest.fn(),
    });
  });

  it("presents app, keymap, and shortcut favorites in the favorites page", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "favorite-app",
          userId: "user-1",
          itemType: "app",
          appSlug: "sample",
        },
        {
          id: "favorite-keymap",
          userId: "user-1",
          itemType: "keymap",
          appSlug: "sample",
          keymapTitle: "Default",
        },
        {
          id: "favorite-shortcut",
          userId: "user-1",
          itemType: "shortcut",
          appSlug: "sample",
          keymapTitle: "Default",
          sectionTitle: "Editing",
          shortcutTitle: "Copy",
        },
      ],
      isLoading: false,
      toggleFavorite: jest.fn(),
    });

    render(<FavoritesContent publicApps={[{ slug: "sample", keymapTitles: ["Default"] }]} />);

    expect(screen.getByText("Apps")).toBeTruthy();
    expect(screen.getByText("Keymaps")).toBeTruthy();
    expect(screen.getByText("Shortcuts")).toBeTruthy();
    expect(screen.getByText("sample")).toBeTruthy();
    expect(screen.getByText("Default / sample")).toBeTruthy();
    expect(screen.getByText("Copy / Default / sample")).toBeTruthy();
  });

  it("does not describe favorites as keymap storage", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<FavoritesContent publicApps={[{ slug: "sample", keymapTitles: ["Default"] }]} />);

    expect(screen.getByText("Sign in to save your favorite apps")).toBeTruthy();
    expect(screen.queryByText(/keymaps/i)).toBeNull();
  });
});

it("removes unresolved legacy favorites by their stored row ID", async () => {
  const removeFavorite = jest.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined);
  mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
  mockUseFavorites.mockReturnValue({ favorites: [{ id: "orphan-row", itemType: "shortcut", appSlug: "deleted-app", shortcutTitle: "Old Copy" }], isLoading: false, removeFavorite });
  render(<FavoritesContent />);
  expect(screen.getByText(/target unavailable/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Remove Old Copy/ }));
  await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith("orphan-row"));
});
