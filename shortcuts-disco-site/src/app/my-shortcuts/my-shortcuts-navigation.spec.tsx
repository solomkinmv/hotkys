import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom/jest-globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CustomApp, UserCustomizations } from "@/lib/model/user/user-models";

const user = { id: "user-1" };
let mockSearchParams = new URLSearchParams();
let saved: UserCustomizations;
let mockReadFailure = false;
const mockPush = jest.fn((url: string) => {
  mockSearchParams = new URLSearchParams(url.split("?")[1]);
});
const mockCreateApp = jest.fn(async (values: Pick<CustomApp, "slug" | "name">) => {
  const app: CustomApp = {
    id: "new-app",
    userId: "user-1",
    ...values,
    keymaps: [],
  };
  saved.customApps.push(app);
  return app;
});

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/my-shortcuts",
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
}));
jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({ user, isLoading: false }),
}));
// Keep the real hook and editor; replace only persistence with detached snapshots.
jest.mock("@/lib/hooks/use-favorites", () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: jest.fn(),
    refetch: async () => {},
  }),
}));

jest.mock("@/lib/services/customizations-service", () => ({
  customizationsService: {
    getAllCustomizations: async () => {
      if (mockReadFailure) {
        mockReadFailure = false;
        throw new Error("Connection interrupted");
      }
      return JSON.parse(JSON.stringify(saved));
    },
    createCustomApp: mockCreateApp,
    createCustomKeymap: async () => {
      const keymap = {
        id: "keymap-1",
        customAppId: "app-1",
        title: "Default",
        sections: [],
      };
      saved.customApps[0].keymaps.push(keymap);
      return keymap;
    },
    createCustomSection: async () => {
      saved.customApps[0].keymaps[0].sections.push({
        id: "section-1",
        keymapId: "keymap-1",
        title: "General",
        sortOrder: 0,
        shortcuts: [],
      });
    },
    createCustomShortcut: async () => {
      saved.customApps[0].keymaps[0].sections[0].shortcuts.push({
        id: "shortcut-1",
        sectionId: "section-1",
        title: "Focus address",
        key: "cmd+l",
        isDeleted: false,
        sortOrder: 0,
      });
    },
  },
}));

jest.mock("@/lib/services/user-service", () => ({
  userService: {
    getProfile: async () => null,
    getPreferences: async () => null,
  },
}));
jest.mock("@/lib/services/favorites-service", () => ({
  favoritesService: { getFavorites: async () => [] },
}));
const { AccountDataProvider } =
  require("@/components/auth/account-data-provider") as typeof import("@/components/auth/account-data-provider");
const { MyShortcutsContent } =
  require("./my-shortcuts-content") as typeof import("./my-shortcuts-content");

describe("My Shortcuts navigation", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockCreateApp.mockClear();
    mockSearchParams = new URLSearchParams();
    mockReadFailure = false;
    saved = {
      customApps: [
        {
          id: "app-1",
          userId: "user-1",
          slug: "local-tool",
          name: "Local Tool",
          keymaps: [],
        },
      ],
      customKeymaps: [],
      shortcuts: [],
      favorites: [],
    };
  });

  it("opens a newly created app using the same account provider without reloading", async () => {
    saved.customApps = [];
    const { rerender } = render(<MyShortcutsContent />, {
      wrapper: AccountDataProvider,
    });
    await screen.findByText("Start with one app.");
    fireEvent.click(screen.getByRole("button", { name: "New App" }));
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "New Tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/my-shortcuts?app=new-tool"),
    );
    rerender(<MyShortcutsContent />);
    expect(
      await screen.findByRole("heading", { name: "New Tool" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add keymap" })).toBeInTheDocument();
    expect(screen.queryByText("App not found")).not.toBeInTheDocument();
    expect(mockCreateApp).toHaveBeenCalledTimes(1);
  });

  it("recovers a saved app after a failed refresh without creating it again", async () => {
    saved.customApps = [];
    render(<MyShortcutsContent />, { wrapper: AccountDataProvider });
    await screen.findByText("Start with one app.");
    mockReadFailure = true;
    fireEvent.click(screen.getByRole("button", { name: "New App" }));
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "New Tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));
    expect(
      await screen.findByText(/App created, but couldn’t reload/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    expect(await screen.findByText("New Tool")).toBeInTheDocument();
    expect(saved.customApps).toHaveLength(1);
    expect(mockCreateApp).toHaveBeenCalledTimes(1);
  });

  it("refreshes summary counts after adding content in the editor and returning without a page reload", async () => {
    const { rerender } = render(<MyShortcutsContent />, {
      wrapper: AccountDataProvider,
    });
    expect(
      await screen.findByText("0 keymaps / 0 shortcuts"),
    ).toBeInTheDocument();

    mockSearchParams = new URLSearchParams("app=local-tool");
    rerender(<MyShortcutsContent />);
    fireEvent.click(await screen.findByRole("button", { name: "Add keymap" }));
    fireEvent.change(screen.getByLabelText("Keymap name"), {
      target: { value: "Default" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create keymap" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add section" }));
    fireEvent.change(screen.getByLabelText("Section name"), {
      target: { value: "General" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create section" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Add shortcut to General" }),
    );
    fireEvent.change(screen.getByLabelText("Action"), {
      target: { value: "Focus address" },
    });
    fireEvent.change(screen.getByLabelText("Keyboard shortcut"), {
      target: { value: "cmd+l" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save shortcut" }));
    expect(await screen.findByText("Focus address")).toBeInTheDocument();

    mockSearchParams = new URLSearchParams();
    mockReadFailure = false;
    rerender(<MyShortcutsContent />);
    expect(
      await screen.findByText("1 keymap / 1 shortcut"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("0 keymaps / 0 shortcuts"),
    ).not.toBeInTheDocument();
  });
  it("recovers from an initial load failure without presenting an empty workspace", async () => {
    mockReadFailure = true;
    render(<MyShortcutsContent />, { wrapper: AccountDataProvider });
    expect(
      await screen.findByRole("heading", { name: "Couldn’t load your apps" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Start with one app.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    expect(await screen.findByText("Local Tool")).toBeInTheDocument();
  });
});
