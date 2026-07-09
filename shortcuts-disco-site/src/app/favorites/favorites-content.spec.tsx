import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";

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

  it("only presents app favorites in the favorites page", () => {
    render(<FavoritesContent />);

    expect(screen.getByText("Apps")).toBeTruthy();
    expect(screen.getAllByText("sample")).toHaveLength(1);
    expect(screen.queryByText("Keymaps")).toBeNull();
    expect(screen.queryByText("Default")).toBeNull();
  });

  it("does not describe favorites as keymap storage", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(<FavoritesContent />);

    expect(screen.getByText("Sign in to save your favorite apps")).toBeTruthy();
    expect(screen.queryByText(/keymaps/i)).toBeNull();
  });
});
