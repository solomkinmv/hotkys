import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getBaseShortcutId } from "@/lib/shortcut-identity";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";

const mockUseAuth = jest.fn();
const mockUseFavorites = jest.fn();
const mockUseCustomizations = jest.fn();
const removeMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const refetchMock = jest.fn<() => Promise<void>>();
jest.mock("@/components/auth/auth-provider", () => ({ useAuth: mockUseAuth }));
jest.mock("@/lib/hooks/use-favorites", () => ({
  useFavorites: mockUseFavorites,
}));
jest.mock("@/lib/hooks/use-customizations", () => ({
  useCustomizations: mockUseCustomizations,
}));
jest.mock("@/lib/services/favorites-service", () => ({
  favoritesService: { removeFavorite: removeMock },
}));
const { FavoritesContent } =
  require("./favorites-content") as typeof import("./favorites-content");
const shortcut = {
  title: "Reply",
  sequence: [],
  comment: "Swipe from right to left",
};
const app: AppShortcuts = {
  name: "Sample App",
  slug: "sample",
  keymaps: [
    { title: "Default", sections: [{ title: "Editing", hotkeys: [shortcut] }] },
  ],
};
const favorite = {
  id: "saved-shortcut",
  itemType: "shortcut",
  appSlug: "sample",
  keymapTitle: "Default",
  sectionTitle: "Editing",
  shortcutTitle: "Reply",
  baseShortcutId: getBaseShortcutId(shortcut, 0),
};

describe("FavoritesContent", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    removeMock.mockReset();
    removeMock.mockResolvedValue(undefined);
    refetchMock.mockReset();
    refetchMock.mockResolvedValue(undefined);
    mockUseFavorites.mockReturnValue({
      favorites: [
        { id: "saved-app", itemType: "app", appSlug: "sample" },
        {
          id: "saved-keymap",
          itemType: "keymap",
          appSlug: "sample",
          keymapTitle: "Default",
        },
        favorite,
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: [],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
    });
  });
  it("resolves app names and preserves instruction-only shortcuts and exact destinations", () => {
    render(<FavoritesContent applications={[app]} />);
    expect(screen.getByRole("region", { name: "Saved apps" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Saved keymaps" })).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Saved shortcuts" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("group", { name: "How to do it: Reply" }).textContent,
    ).toBe("Swipe from right to left");
    expect(
      screen.getByRole("link", { name: /Reply/ }).getAttribute("href"),
    ).toBe("/apps/sample/default#Editing");
  });
  it("removes the persisted favorite by ID without adding a legacy duplicate", async () => {
    render(<FavoritesContent applications={[app]} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Reply from favorites" }),
    );
    await waitFor(() =>
      expect(removeMock).toHaveBeenCalledWith("saved-shortcut", {
        id: "user-1",
      }),
    );
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());
  });
  it("keeps a failed removal visible and lets the user retry", async () => {
    removeMock.mockRejectedValueOnce(new Error("Connection interrupted"));
    render(<FavoritesContent applications={[app]} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Reply from favorites" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Connection interrupted",
    );
    expect(screen.getByRole("link", { name: /Reply/ })).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Reply from favorites" }),
    );
    await waitFor(() => expect(removeMock).toHaveBeenCalledTimes(2));
  });
  it("retains unresolved entries and clears an empty search", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        { ...favorite, appSlug: "missing", baseShortcutId: "missing-id" },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    render(<FavoritesContent applications={[app]} />);
    expect(screen.getByText(/Shortcut unavailable/)).toBeTruthy();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search favorites" }),
      { target: { value: "zzz" } },
    );
    expect(
      screen.getByRole("heading", { name: "No matching favorites" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      screen.getByRole("button", { name: "Remove Reply from favorites" }),
    ).toBeTruthy();
  });
  it("routes custom-app favorites by the saved app ID after a rename", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "custom-fav",
          itemType: "app",
          customAppId: "private-1",
          appSlug: "custom-old",
        },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [
          {
            id: "private-1",
            name: "Private Tool",
            slug: "renamed",
            keymaps: [],
          },
        ],
        customKeymaps: [],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
    });
    render(<FavoritesContent applications={[app]} />);
    expect(
      screen.getByRole("link", { name: /Private Tool/ }).getAttribute("href"),
    ).toBe("/my-shortcuts?app=renamed");
  });
  it("returns signed-out visitors to favorites after sign-in", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(<FavoritesContent applications={[app]} />);
    expect(
      screen
        .getByRole("link", { name: /Sign in to save favorites/ })
        .getAttribute("href"),
    ).toBe("/auth/login?next=%2Ffavorites");
  });
  it("shows a retryable load error rather than an empty collection", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [],
      isLoading: false,
      error: "Connection interrupted",
      refetch: refetchMock,
    });
    const refetchCustomizations = jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined);
    const state = mockUseCustomizations() as object;
    mockUseCustomizations.mockReturnValue({
      ...state,
      refetch: refetchCustomizations,
    });
    render(<FavoritesContent applications={[app]} />);
    expect(
      screen.getByRole("heading", { name: "Couldn’t load your collection" }),
    ).toBeTruthy();
    expect(screen.queryByText("Make this space yours.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    expect(refetchMock).toHaveBeenCalled();
    expect(refetchCustomizations).toHaveBeenCalled();
  });
  it("resolves a renamed and moved private shortcut among duplicate titles by ID", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "private-fav",
          itemType: "shortcut",
          customShortcutId: "shortcut-2",
        },
        {
          id: "private-keymap-fav",
          itemType: "keymap",
          customKeymapId: "keymap-2",
        },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [
          {
            id: "private-1",
            name: "Renamed tool",
            slug: "new-tool",
            keymaps: [
              {
                id: "keymap-1",
                title: "Default",
                sections: [
                  {
                    id: "section-1",
                    title: "General",
                    sortOrder: 0,
                    shortcuts: [
                      {
                        id: "shortcut-1",
                        title: "Reply",
                        comment: "Wrong method",
                        sortOrder: 0,
                        isDeleted: false,
                      },
                    ],
                  },
                ],
              },
              {
                id: "keymap-2",
                title: "Default",
                sections: [
                  {
                    id: "section-2",
                    title: "General",
                    sortOrder: 0,
                    shortcuts: [
                      {
                        id: "shortcut-2",
                        title: "Renamed action",
                        comment: "Swipe left",
                        sortOrder: 0,
                        isDeleted: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        customKeymaps: [],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
    });
    render(<FavoritesContent applications={[app]} />);
    expect(
      screen.getByRole("link", { name: /Renamed action/ }).getAttribute("href"),
    ).toBe("/my-shortcuts?app=new-tool&keymap=keymap-2#shortcut-shortcut-2");
    expect(
      screen.getByRole("group", { name: "How to do it: Renamed action" })
        .textContent,
    ).toBe("Swipe left");
    expect(screen.queryByText("Wrong method")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /Default.*Renamed tool/ })
        .getAttribute("href"),
    ).toBe("/my-shortcuts?app=new-tool&keymap=keymap-2");
  });
  it("keeps ambiguous legacy private favorites removable without guessing a method", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "legacy-private",
          itemType: "shortcut",
          appSlug: "custom-private",
          keymapTitle: "Default",
          sectionTitle: "General",
          shortcutTitle: "Reply",
        },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    const section = {
      id: "s",
      title: "General",
      sortOrder: 0,
      shortcuts: [
        {
          id: "h",
          title: "Reply",
          comment: "Wrong method",
          sortOrder: 0,
          isDeleted: false,
        },
      ],
    };
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [
          {
            id: "private-1",
            name: "Private",
            slug: "private",
            keymaps: [
              { id: "k1", title: "Default", sections: [section] },
              {
                id: "k2",
                title: "Default",
                sections: [
                  {
                    ...section,
                    id: "s2",
                    shortcuts: [{ ...section.shortcuts[0], id: "h2" }],
                  },
                ],
              },
            ],
          },
        ],
        customKeymaps: [],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
    });
    render(<FavoritesContent applications={[]} />);
    expect(screen.getByText(/Shortcut unavailable/)).toBeTruthy();
    expect(screen.queryByText("Wrong method")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove Reply from favorites" }),
    ).toBeTruthy();
  });
  it("preserves existing stable public custom favorites without management controls", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "public-map-fav",
          itemType: "keymap",
          customKeymapId: "public-map",
        },
        {
          id: "public-shortcut-fav",
          itemType: "shortcut",
          customShortcutId: "public-custom-action",
        },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: [
          {
            id: "public-map",
            baseAppSlug: "sample",
            title: "Default",
            sections: [
              {
                id: "public-section",
                title: "Custom actions",
                sortOrder: 0,
                shortcuts: [
                  {
                    id: "public-custom-action",
                    title: "Launch palette",
                    key: "cmd+k",
                    sortOrder: 0,
                    isDeleted: false,
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
    });
    render(<FavoritesContent applications={[app]} />);
    expect(
      screen
        .getByRole("link", { name: /Default.*Sample App/ })
        .getAttribute("href"),
    ).toBe("/apps/sample/default");
    expect(
      screen.getByRole("link", { name: /Launch palette/ }).getAttribute("href"),
    ).toBe("/apps/sample/default#Custom%20actions");
    expect(screen.queryByRole("button", { name: /Manage/ })).toBeNull();
  });
  it("resolves old public identities to the current method and destination", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [favorite],
      isLoading: false,
      refetch: refetchMock,
    });
    render(
      <FavoritesContent
        applications={[
          {
            ...app,
            keymaps: [
              {
                title: "Default",
                sections: [
                  {
                    title: "Editing",
                    hotkeys: [
                      {
                        ...shortcut,
                        baseShortcutId: "v2:stable-reply",
                        baseShortcutAliases: [favorite.baseShortcutId],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("group", { name: "How to do it: Reply" }).textContent,
    ).toBe("Swipe from right to left");
    expect(
      screen.getByRole("link", { name: /Reply/ }).getAttribute("href"),
    ).toBe("/apps/sample/default#Editing");
  });

  it("routes child-only favorites for an added public keymap through an exported base page", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        {
          id: "saved-added",
          itemType: "shortcut",
          customShortcutId: "added-action",
        },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: [
          {
            id: "added-map",
            baseAppSlug: "sample",
            title: "My custom map",
            sections: [
              {
                id: "added-section",
                title: "Custom actions",
                sortOrder: 0,
                shortcuts: [
                  {
                    id: "added-action",
                    title: "Quick palette",
                    key: "cmd+k",
                    sortOrder: 0,
                    isDeleted: false,
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
    });
    render(<FavoritesContent applications={[app]} />);
    expect(
      screen.getByRole("link", { name: /Quick palette/ }).getAttribute("href"),
    ).toBe("/apps/sample/default?keymap=added-map#Custom%20actions");
  });

  it("groups child-only public favorites under their own resolved app", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [
        { id: "f-one", itemType: "shortcut", customShortcutId: "action-one" },
        { id: "f-two", itemType: "shortcut", customShortcutId: "action-two" },
      ],
      isLoading: false,
      refetch: refetchMock,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: ["sample", "second"].map((slug, i) => ({
          id: `map-${i}`,
          baseAppSlug: slug,
          title: "Default",
          sections: [
            {
              id: `section-${i}`,
              title: "Custom actions",
              sortOrder: 0,
              shortcuts: [
                {
                  id: i ? "action-two" : "action-one",
                  title: i ? "Second action" : "First action",
                  key: "cmd+k",
                  sortOrder: 0,
                  isDeleted: false,
                },
              ],
            },
          ],
        })),
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
    });
    render(
      <FavoritesContent
        applications={[app, { ...app, slug: "second", name: "Second App" }]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Sample App" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Second App" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Second action/ }).getAttribute("href"),
    ).toBe("/apps/second/default#Custom%20actions");
  });
  it("does not relocate a removed public shortcut to an identical method in another app", () => {
    mockUseFavorites.mockReturnValue({
      favorites: [favorite],
      isLoading: false,
      refetch: refetchMock,
    });
    render(
      <FavoritesContent
        applications={[{ ...app, slug: "second", name: "Second App" }]}
      />,
    );
    expect(screen.getByText(/Shortcut unavailable/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Reply/ }).getAttribute("href"),
    ).toBe("/#applications");
    expect(screen.queryByRole("heading", { name: "Second App" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove Reply from favorites" }),
    ).toBeTruthy();
  });
});
