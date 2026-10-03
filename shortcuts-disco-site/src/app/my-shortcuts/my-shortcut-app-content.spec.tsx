import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const updateCustomAppMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const createCustomShortcutMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const privateUpdateMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const privateDeleteMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const reorderMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const refetchMock = jest.fn<() => Promise<void>>();

jest.mock("next/navigation", () => ({
  __esModule: true,
  usePathname: () => "/my-shortcuts",
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("@/components/auth/auth-provider", () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}));

jest.mock("@/lib/hooks/use-customizations", () => ({
  __esModule: true,
  useCustomizations: mockUseCustomizations,
}));

jest.mock("@/lib/hooks/use-favorites", () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: jest.fn(),
    refetch: async () => {},
  }),
}));

jest.mock("@/lib/services/customizations-service", () => ({
  __esModule: true,
  customizationsService: {
    updateCustomApp: updateCustomAppMock,
    updateCustomKeymap: privateUpdateMock,
    createCustomShortcut: createCustomShortcutMock,
  },
}));

jest.mock("@/lib/services/private-apps-service", () => ({
  privateAppsService: {
    updateKeymap: privateUpdateMock,
    updateSection: privateUpdateMock,
    updateShortcut: privateUpdateMock,
    deleteKeymap: privateDeleteMock,
    deleteSection: privateDeleteMock,
    deleteShortcut: privateDeleteMock,
    reorder: reorderMock,
  },
}));

const { MyShortcutAppContent } =
  require("./my-shortcut-app-content") as typeof import("./my-shortcut-app-content");

describe("MyShortcutAppContent", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    for (const mock of [privateUpdateMock, privateDeleteMock, reorderMock]) {
      mock.mockReset();
      mock.mockResolvedValue(undefined);
    }
    updateCustomAppMock.mockReset();
    updateCustomAppMock.mockResolvedValue(undefined);
    createCustomShortcutMock.mockReset();
    createCustomShortcutMock.mockResolvedValue({});
    refetchMock.mockReset();
    refetchMock.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { id: "user-1" },
      isLoading: false,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [
          {
            id: "app-1",
            userId: "user-1",
            name: "Local Tool",
            slug: "local-tool",
            bundleId: "com.local.tool",
            windowsAppId: "Vendor.Package!App",
            windowsProcessName: "Code",
            icon: "/icons/old.png",
            keymaps: [
              {
                id: "keymap-1",
                customAppId: "app-1",
                title: "Default",
                sections: [
                  {
                    id: "section-1",
                    keymapId: "keymap-1",
                    title: "General",
                    sortOrder: 0,
                    shortcuts: [],
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
      refetch: refetchMock,
    });
  });

  it("loads and updates Windows identifiers alongside existing app metadata", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);

    fireEvent.click(screen.getByRole("button", { name: "App details" }));
    fireEvent.click(screen.getByText("Icon and app details"));
    expect(screen.getByLabelText("Windows app ID")).toHaveValue(
      "Vendor.Package!App",
    );
    expect(screen.getByLabelText("Windows process name")).toHaveValue("Code");
    fireEvent.change(screen.getByLabelText("Windows app ID"), {
      target: { value: " Other.Editor!App " },
    });
    fireEvent.change(screen.getByLabelText("Windows process name"), {
      target: { value: " Editor " },
    });
    fireEvent.change(screen.getByLabelText("Image path"), {
      target: { value: "https://cdn.example.com/local-tool.svg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save App" }));

    await waitFor(() =>
      expect(updateCustomAppMock).toHaveBeenCalledWith(
        "app-1",
        {
          name: "Local Tool",
          slug: "local-tool",
          bundleId: "com.local.tool",
          windowsAppId: "Other.Editor!App",
          windowsProcessName: "Editor",
          hostname: null,
          source: null,
          icon: "https://cdn.example.com/local-tool.svg",
        },
        { id: "user-1" },
      ),
    );
  });

  it("clears optional app metadata with null values", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);

    fireEvent.click(screen.getByRole("button", { name: "App details" }));
    fireEvent.click(screen.getByText("Icon and app details"));
    fireEvent.change(screen.getByLabelText("Bundle ID"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Windows app ID"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Windows process name"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Image path"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save App" }));

    await waitFor(() =>
      expect(updateCustomAppMock).toHaveBeenCalledWith(
        "app-1",
        expect.objectContaining({
          bundleId: null,
          windowsAppId: null,
          windowsProcessName: null,
          icon: null,
        }),
        { id: "user-1" },
      ),
    );
  });

  it("offers shortcut modifier builder controls for custom app shortcuts", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Add shortcut to General" }),
    );
    fireEvent.change(screen.getByLabelText("Action"), {
      target: { value: "Undo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add cmd modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Add shift modifier" }));
    expect(
      (screen.getByLabelText("Keyboard shortcut") as HTMLInputElement).value,
    ).toBe("shift+cmd+");
    fireEvent.change(screen.getByLabelText("Keyboard shortcut"), {
      target: { value: "shift+cmd+z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save shortcut" }));

    await waitFor(() =>
      expect(createCustomShortcutMock).toHaveBeenCalledWith(
        {
          sectionId: "section-1",
          title: "Undo",
          key: "shift+cmd+z",
          comment: undefined,
          isDeleted: false,
          sortOrder: 0,
        },
        { id: "user-1" },
      ),
    );
  });
  it("keeps a failed instruction-only shortcut draft and retries without requiring keys", async () => {
    createCustomShortcutMock.mockRejectedValueOnce(
      new Error("Connection interrupted"),
    );
    render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Add shortcut to General" }),
    );
    fireEvent.change(screen.getByLabelText("Action"), {
      target: { value: "Reply" },
    });
    fireEvent.change(
      screen.getByLabelText("Instructions or alternative method"),
      { target: { value: "Double click a message" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save shortcut" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Connection interrupted",
    );
    expect((screen.getByLabelText("Action") as HTMLInputElement).value).toBe(
      "Reply",
    );
    fireEvent.click(screen.getByRole("button", { name: "Save shortcut" }));
    await waitFor(() =>
      expect(createCustomShortcutMock).toHaveBeenCalledTimes(2),
    );
    expect(createCustomShortcutMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        key: undefined,
        comment: "Double click a message",
      }),
      { id: "user-1" },
    );
  });

  it("retries loading after a successful save without creating the shortcut again", async () => {
    refetchMock.mockRejectedValueOnce(new Error("Refresh failed"));
    render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Add shortcut to General" }),
    );
    fireEvent.change(screen.getByLabelText("Action"), {
      target: { value: "Reply" },
    });
    fireEvent.change(
      screen.getByLabelText("Instructions or alternative method"),
      { target: { value: "Double click" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save shortcut" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Saved successfully",
    );
    expect(screen.queryByRole("dialog", { name: "Add shortcut" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(2));
    expect(createCustomShortcutMock).toHaveBeenCalledTimes(1);
  });

  it("renders each same-named section from its own persisted shortcut IDs", () => {
    const current = mockUseCustomizations() as {
      customizations: {
        customApps: Array<{ keymaps: Array<{ sections: unknown[] }> }>;
      };
    };
    current.customizations.customApps[0].keymaps[0].sections = [
      {
        id: "section-1",
        title: "General",
        sortOrder: 0,
        shortcuts: [
          {
            id: "a",
            title: "First action",
            comment: "Double click",
            isDeleted: false,
            sortOrder: 0,
          },
        ],
      },
      {
        id: "section-2",
        title: "General",
        sortOrder: 1,
        shortcuts: [
          {
            id: "b",
            title: "Second action",
            comment: "Swipe right",
            isDeleted: false,
            sortOrder: 0,
          },
        ],
      },
    ];
    render(<MyShortcutAppContent slug="local-tool" />);
    expect(screen.getAllByText("First action")).toHaveLength(1);
    expect(screen.getAllByText("Second action")).toHaveLength(1);
    expect(
      screen.getByRole("group", { name: "How to do it: Second action" })
        .textContent,
    ).toBe("Swipe right");
  });
  it("opens the saved slug even when refreshing after a rename fails", async () => {
    refetchMock.mockRejectedValueOnce(new Error("Refresh failed"));
    render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.click(screen.getByRole("button", { name: "App details" }));
    fireEvent.click(screen.getByText("Icon and app details"));
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "renamed-tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save App" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Saved successfully",
    );
    expect(replaceMock).toHaveBeenCalledWith("/my-shortcuts?app=renamed-tool");
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(2));
    expect(updateCustomAppMock).toHaveBeenCalledTimes(1);
  });
  async function menu(label: string, item: string) {
    fireEvent.keyDown(screen.getByRole("button", { name: `Manage ${label}` }), {
      key: "Enter",
    });
    fireEvent.click(await screen.findByRole("menuitem", { name: item }));
  }

  function addPrivateItems() {
    const state = mockUseCustomizations() as {
      customizations: {
        customApps: Array<{ keymaps: Array<{ sections: unknown[] }> }>;
      };
    };
    state.customizations.customApps[0].keymaps[0].sections = [
      {
        id: "section-1",
        keymapId: "keymap-1",
        title: "General",
        sortOrder: 0,
        shortcuts: [
          {
            id: "shortcut-1",
            sectionId: "section-1",
            title: "Reply",
            key: "cmd+r",
            comment: "Double click",
            isDeleted: false,
            sortOrder: 0,
          },
          {
            id: "shortcut-2",
            sectionId: "section-1",
            title: "Forward",
            key: "cmd+f",
            isDeleted: false,
            sortOrder: 1,
          },
        ],
      },
      {
        id: "section-2",
        keymapId: "keymap-1",
        title: "Mouse",
        sortOrder: 1,
        shortcuts: [],
      },
    ];
  }

  it("renames private keymaps and sections by ID", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);
    await menu("keymap Default", "Edit");
    fireEvent.change(screen.getByLabelText("Keymap name"), {
      target: { value: "macOS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save keymap" }));
    await waitFor(() =>
      expect(privateUpdateMock).toHaveBeenCalledWith(
        "keymap-1",
        { title: "macOS", platforms: ["macos", "windows", "linux"] },
        { id: "user-1" },
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await menu("section General", "Edit");
    fireEvent.change(screen.getByLabelText("Section name"), {
      target: { value: "Editing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save section" }));
    await waitFor(() =>
      expect(privateUpdateMock).toHaveBeenLastCalledWith(
        "app-1",
        "section-1",
        { title: "Editing" },
        { id: "user-1" },
      ),
    );
  });

  it("edits and moves a private shortcut while retaining its ID", async () => {
    addPrivateItems();
    render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Shortcut section" }),
      { key: "ArrowDown" },
    );
    fireEvent.click(
      await screen.findByRole("option", { name: "Default / Mouse" }),
    );
    fireEvent.change(screen.getByLabelText("Keyboard shortcut"), {
      target: { value: "" },
    });
    fireEvent.change(
      screen.getByLabelText("Instructions or alternative method"),
      { target: { value: "Swipe left" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save shortcut" }));
    await waitFor(() =>
      expect(privateUpdateMock).toHaveBeenCalledWith(
        "app-1",
        "shortcut-1",
        {
          title: "Reply",
          key: undefined,
          comment: "Swipe left",
          sectionId: "section-2",
        },
        { id: "user-1" },
      ),
    );
  });

  it("reorders the full sibling set within its private parent", async () => {
    addPrivateItems();
    render(<MyShortcutAppContent slug="local-tool" />);
    await menu("shortcut Reply", "Move down");
    await waitFor(() =>
      expect(reorderMock).toHaveBeenCalledWith(
        "app-1",
        "shortcut",
        "section-1",
        ["shortcut-2", "shortcut-1"],
        { id: "user-1" },
      ),
    );
  });

  it("confirms cascading deletion, keeps failed writes retryable, and only reloads after success", async () => {
    addPrivateItems();
    privateDeleteMock.mockRejectedValueOnce(
      new Error("Connection interrupted"),
    );
    refetchMock.mockRejectedValueOnce(new Error("Read interrupted"));
    render(<MyShortcutAppContent slug="local-tool" />);
    await menu("section General", "Delete");
    const confirm = await screen.findByRole("dialog", {
      name: "Delete General?",
    });
    expect(confirm.textContent).toContain("2 items");
    expect(confirm.textContent).toContain("Saved favorites");
    expect(privateDeleteMock).not.toHaveBeenCalled();
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Delete section" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Connection interrupted",
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete section" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Saved successfully",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(2));
    expect(privateDeleteMock).toHaveBeenCalledTimes(2);
    expect(privateDeleteMock).toHaveBeenLastCalledWith("app-1", "section-1", {
      id: "user-1",
    });
  });
  it("edits private app web metadata and keymap platforms", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.click(screen.getByRole("button", { name: "App details" }));
    fireEvent.click(screen.getByText("Icon and app details"));
    fireEvent.change(screen.getByLabelText("Hostname"), {
      target: { value: "example.com" },
    });
    fireEvent.change(screen.getByLabelText("Source URL"), {
      target: { value: "https://example.com/shortcuts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save App" }));
    await waitFor(() =>
      expect(updateCustomAppMock).toHaveBeenCalledWith(
        "app-1",
        expect.objectContaining({
          hostname: "example.com",
          source: "https://example.com/shortcuts",
        }),
        { id: "user-1" },
      ),
    );
    await menu("keymap Default", "Edit");
    fireEvent.click(screen.getByLabelText("Windows"));
    fireEvent.click(screen.getByLabelText("Linux"));
    fireEvent.click(screen.getByRole("button", { name: "Save keymap" }));
    await waitFor(() =>
      expect(privateUpdateMock).toHaveBeenCalledWith(
        "keymap-1",
        { title: "Default", platforms: ["macos"] },
        { id: "user-1" },
      ),
    );
  });
  it("moves visible shortcuts past hidden legacy rows while reordering every persisted sibling", async () => {
    const state = mockUseCustomizations() as {
      customizations: {
        customApps: { keymaps: { sections: { shortcuts: unknown[] }[] }[] }[];
      };
    };
    state.customizations.customApps[0].keymaps[0].sections[0].shortcuts = [
      {
        id: "one",
        title: "Copy",
        key: "cmd+c",
        sortOrder: 0,
        isDeleted: false,
      },
      {
        id: "hidden",
        title: "Hidden",
        key: "cmd+x",
        sortOrder: 1,
        isDeleted: true,
      },
      {
        id: "two",
        title: "Paste",
        key: "cmd+v",
        sortOrder: 2,
        isDeleted: false,
      },
    ];
    render(<MyShortcutAppContent slug="local-tool" />);
    await menu("shortcut Copy", "Move down");
    await waitFor(() =>
      expect(reorderMock).toHaveBeenCalledWith(
        "app-1",
        "shortcut",
        "section-1",
        ["two", "hidden", "one"],
        { id: "user-1" },
      ),
    );
  });
});
