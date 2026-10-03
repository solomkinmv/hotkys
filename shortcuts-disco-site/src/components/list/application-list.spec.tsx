import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";
import { appDescriptions } from "@/lib/app-descriptions";
import catalog from "../../../public/data/combined-apps.json";

const mockUseMergedShortcuts = jest.fn();
const mockUseAuth = jest.fn();
const mockUseFavorites = jest.fn();
jest.mock("@/components/auth/auth-provider", () => ({ useAuth: mockUseAuth }));
jest.mock("@/lib/hooks/use-favorites", () => ({ useFavorites: mockUseFavorites }));
jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

jest.mock("@/lib/hooks/use-merged-shortcuts", () => ({
  __esModule: true,
  useMergedShortcuts: mockUseMergedShortcuts,
}));

jest.mock("@/lib/hooks/use-platform", () => ({
  __esModule: true,
  usePlatform: () => "macos",
}));

jest.mock("@/lib/hooks/use-platform-filter", () => ({
  __esModule: true,
  usePlatformFilter: () => ({
    platformFilter: null,
    setPlatformFilter: jest.fn(),
  }),
}));

jest.mock("@/lib/hooks/use-keyboard-navigation", () => ({
  __esModule: true,
  useKeyboardNavigation: () => ({
    selectedIndex: -1,
    itemRefs: { current: [] },
  }),
}));

const { ApplicationList } =
  require("./application-list") as typeof import("./application-list");

const baseApps: AppShortcuts[] = [
  {
    name: "Sample",
    slug: "sample",
    keymaps: [
      {
        title: "Default",
        platforms: ["macos"],
        sections: [],
      },
    ],
  },
];

const customApp: AppShortcuts = {
  name: "My Tool",
  slug: "custom-my-tool",
  keymaps: [
    {
      title: "Default",
      sections: [],
    },
  ],
};

describe("ApplicationList", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockUseFavorites.mockReturnValue({ favorites: [], isLoading: false, isFavorite: () => false, toggleFavorite: jest.fn() });
    mockUseMergedShortcuts.mockReturnValue({
      applications: [...baseApps, customApp],
      isLoading: false,
      isAuthenticated: true,
    });
  });

  it("includes account-local custom apps and routes them to the static management page", () => {
    render(<ApplicationList applications={baseApps} />);

    expect(screen.getByText("Sample")).toBeTruthy();
    expect(screen.getByText("My Tool")).toBeTruthy();
    expect(screen.getByText("Custom")).toBeTruthy();
    expect(screen.getByRole("link", { name: /sample,/i }).getAttribute("href"))
      .toBe("/apps/sample/default");
    expect(screen.getByRole("link", { name: /my tool/i }).getAttribute("href"))
      .toBe("/my-shortcuts?app=my-tool");
  });

  it("describes every catalog app and provides copy for custom apps", () => {
    expect(catalog.list.filter(app => !appDescriptions[app.slug]?.trim())).toEqual([]);
    mockUseMergedShortcuts.mockReturnValue({ applications: [{ ...baseApps[0], name: "Figma", slug: "figma" }, customApp] });
    render(<ApplicationList applications={baseApps} />);
    expect(screen.getByText("Design interfaces and collaborate with your team.")).toBeTruthy();
    expect(screen.getByText("Your personal shortcuts, collected in one place.")).toBeTruthy();
  });

  it("searches apps and recovers from an empty result", () => {
    render(<ApplicationList applications={baseApps} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzzzzzz" } });
    expect(screen.getByText("No apps found")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("link", { name: /sample,/i })).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "My Tool" } });
    expect(screen.queryByRole("link", { name: /sample,/i })).toBeNull();
    expect(screen.getByRole("link", { name: /my tool,/i })).toBeTruthy();
  });

  it("uses saved app favorites and links to the full collection", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    mockUseFavorites.mockReturnValue({ favorites: [{ itemType: "app", appSlug: "sample" }, { itemType: "shortcut", appSlug: "custom-my-tool" }, { itemType: "app", appSlug: "missing" }], isLoading: false, isFavorite: () => false });
    render(<ApplicationList applications={baseApps} />);
    const panel = within(screen.getByRole("region", { name: "Your favorites, within reach." }));
    expect(panel.getByRole("link", { name: /sample/i }).getAttribute("href")).toBe("/apps/sample/default");
    expect(panel.queryByText("My Tool")).toBeNull();
    expect(panel.getByRole("link", { name: /view favorites/i }).getAttribute("href")).toBe("/favorites");
  });

  it("finds private app favorites by ID after an app rename", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    mockUseMergedShortcuts.mockReturnValue({ applications: [...baseApps, { ...customApp, customAppId: "private-id", slug: "custom-renamed", name: "Renamed" }] });
    mockUseFavorites.mockReturnValue({ favorites: [{ itemType: "app", customAppId: "private-id" }], isLoading: false, isFavorite: () => false });
    render(<ApplicationList applications={baseApps} />);
    const panel = within(screen.getByRole("region", { name: "Your favorites, within reach." }));
    expect(panel.getByRole("link", { name: /renamed/i }).getAttribute("href")).toBe("/my-shortcuts?app=renamed");
  });

  it("shows a signed-out invitation and an authenticated empty state", () => {
    const { rerender } = render(<ApplicationList applications={baseApps} />);
    expect(screen.getByRole("link", { name: /sign in to save favorites/i }).getAttribute("href")).toBe("/auth/login");
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    rerender(<ApplicationList applications={baseApps} />);
    expect(screen.getByText("Tap a star below to save your first app.")).toBeTruthy();
    mockUseFavorites.mockReturnValue({ favorites: [], isLoading: true, isFavorite: () => false });
    rerender(<ApplicationList applications={baseApps} />);
    expect(screen.getByText("Loading your favorites…")).toBeTruthy();
  });

  it("announces a failed favorite mutation without navigating away", async () => {
    const toggleFavorite = jest.fn<(identifier: unknown) => Promise<void>>().mockRejectedValue(new Error("Offline"));
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    mockUseFavorites.mockReturnValue({ favorites: [], isLoading: false, isFavorite: () => false, toggleFavorite });
    render(<ApplicationList applications={baseApps} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not update favorites. Please try again.");
    expect(toggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ itemType: "app", appSlug: "sample" }));
  });
});
