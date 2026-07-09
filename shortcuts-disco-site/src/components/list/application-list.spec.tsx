import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";

const mockUseMergedShortcuts = jest.fn();

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
    expect(screen.getByRole("link", { name: /sample/i }).getAttribute("href"))
      .toBe("/apps/sample/default");
    expect(screen.getByRole("link", { name: /my tool/i }).getAttribute("href"))
      .toBe("/my-shortcuts?app=my-tool");
  });
});
