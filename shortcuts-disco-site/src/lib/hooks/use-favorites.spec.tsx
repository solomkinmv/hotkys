import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Favorite } from "@/lib/model/user/user-models";

const user = { id: "user-1" };
const getMock = jest.fn<(...args: unknown[]) => Promise<Favorite[]>>();
const addMock = jest.fn<(...args: unknown[]) => Promise<Favorite>>();
const removeMock = jest.fn<(...args: unknown[]) => Promise<void>>();
jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({ user }),
}));
jest.mock("@/lib/services/favorites-service", () => ({
  favoritesService: {
    getFavorites: getMock,
    addFavorite: addMock,
    removeFavorite: removeMock,
  },
}));
const { FavoritesProvider, useFavorites } =
  require("./use-favorites") as typeof import("./use-favorites");

function setup() {
  return renderHook(() => useFavorites(), { wrapper: FavoritesProvider });
}

describe("private favorites", () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue([]);
    addMock.mockReset();
    removeMock.mockReset().mockResolvedValue(undefined);
  });

  it.each([
    ["app", "customAppId"],
    ["keymap", "customKeymapId"],
    ["shortcut", "customShortcutId"],
  ] as const)(
    "stores a private %s by its own ID and preserves it through renames",
    async (itemType, field) => {
      const created = {
        id: "favorite-1",
        userId: user.id,
        itemType,
        [field]: "target-1",
      } as Favorite;
      addMock.mockResolvedValue(created);
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const target = {
        itemType,
        appSlug: "custom-old",
        keymapTitle: "Old map",
        shortcutTitle: "Old action",
        [field]: "target-1",
      };
      await act(() => result.current.toggleFavorite(target));
      expect(addMock).toHaveBeenCalledWith(
        { itemType, [field]: "target-1" },
        user,
      );
      expect(
        result.current.isFavorite({
          ...target,
          appSlug: "custom-renamed",
          keymapTitle: "New map",
          shortcutTitle: "New action",
        }),
      ).toBe(true);
      expect(
        result.current.isFavorite({ ...target, [field]: "different-id" }),
      ).toBe(false);
      // A successful write updates local state; a later read cannot repeat it.
      expect(getMock).toHaveBeenCalledTimes(1);
      await act(() =>
        result.current.toggleFavorite({ ...target, appSlug: "custom-renamed" }),
      );
      expect(removeMock).toHaveBeenCalledWith("favorite-1", user);
      expect(result.current.favorites).toEqual([]);
    },
  );

  it("removes a legacy public favorite by persisted ID when its saved shortcut identity is missing", async () => {
    getMock.mockResolvedValue([
      {
        id: "legacy",
        customKeymapId: "legacy-ancestor",
        userId: user.id,
        itemType: "shortcut",
        appSlug: "finder",
        keymapTitle: "Default",
        sectionTitle: "General",
        shortcutTitle: "Search",
      },
    ]);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() =>
      result.current.toggleFavorite({
        itemType: "shortcut",
        appSlug: "finder",
        keymapTitle: "Default",
        sectionTitle: "General",
        shortcutTitle: "Search",
        baseShortcutId: "current-id",
      }),
    );
    expect(removeMock).toHaveBeenCalledWith("legacy", user);
    expect(addMock).not.toHaveBeenCalled();
  });

  it("keeps the star state unchanged after a failed save or removal", async () => {
    const favorite: Favorite = {
      id: "saved",
      userId: user.id,
      itemType: "app",
      customAppId: "app-1",
    };
    getMock.mockResolvedValue([favorite]);
    removeMock.mockRejectedValueOnce(new Error("Offline"));
    addMock.mockRejectedValueOnce(new Error("Offline"));
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const existing = {
      itemType: "app" as const,
      customAppId: "app-1",
      appSlug: "custom-tool",
    };
    await act(async () => {
      await expect(result.current.toggleFavorite(existing)).rejects.toThrow(
        "Offline",
      );
    });
    expect(result.current.isFavorite(existing)).toBe(true);
    const next = { ...existing, customAppId: "app-2" };
    await act(async () => {
      await expect(result.current.toggleFavorite(next)).rejects.toThrow(
        "Offline",
      );
    });
    expect(result.current.isFavorite(next)).toBe(false);
  });
});
