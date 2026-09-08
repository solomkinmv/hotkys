import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const updateCustomAppMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const createCustomShortcutMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateKeymapMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const updateSectionMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const updateShortcutMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const deleteShortcutMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const reorderMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const refetchMock = jest.fn<() => Promise<void>>();

jest.mock("next/navigation", () => ({
  __esModule: true,
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

jest.mock("@/lib/services/customizations-service", () => ({
  __esModule: true,
  customizationsService: {
    updateCustomApp: updateCustomAppMock,
    updateCustomKeymap: updateKeymapMock,
    updateCustomSection: updateSectionMock,
    updateCustomShortcut: updateShortcutMock,
    deleteCustomShortcut: deleteShortcutMock,
    reorderCustomItems: reorderMock,
    createCustomShortcut: createCustomShortcutMock,
  },
}));

const { MyShortcutAppContent } =
  require("./my-shortcut-app-content") as typeof import("./my-shortcut-app-content");

describe("MyShortcutAppContent", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    [updateKeymapMock, updateSectionMock, updateShortcutMock, deleteShortcutMock, reorderMock].forEach(mock => { mock.mockReset(); mock.mockResolvedValue(undefined); });
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

  it("updates custom apps with an arbitrary image path", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);

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

    fireEvent.change(screen.getByLabelText("Bundle ID"), {
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
          icon: null,
        }),
        { id: "user-1" },
      ),
    );
  });

  it("offers shortcut modifier builder controls for custom app shortcuts", async () => {
    render(<MyShortcutAppContent slug="local-tool" />);

    fireEvent.change(screen.getByPlaceholderText("Shortcut title"), {
      target: { value: "Undo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add cmd modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Add shift modifier" }));
    expect((screen.getByLabelText("Shortcut keys") as HTMLInputElement).value).toBe(
      "shift+cmd+",
    );
    fireEvent.change(screen.getByLabelText("Shortcut keys"), {
      target: { value: "shift+cmd+z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Shortcut" }));

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
  it("saves source and hostname, edits platform metadata, and preserves an unsaved app name across child refetch", async () => {
    const { rerender } = render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.change(screen.getByLabelText("Hostname"), { target: { value: "example.com" } });
    fireEvent.change(screen.getByLabelText("Source URL"), { target: { value: "https://example.com/shortcuts" } });
    fireEvent.click(screen.getByRole("button", { name: "Save App" }));
    await waitFor(() => expect(updateCustomAppMock).toHaveBeenCalledWith("app-1", expect.objectContaining({ hostname: "example.com", source: "https://example.com/shortcuts" }), { id: "user-1" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Keymap" }).hasAttribute("disabled")).toBe(false));
    fireEvent.change(screen.getByLabelText("App Name"), { target: { value: "Unsaved metadata" } });
    fireEvent.change(screen.getByLabelText("Keymap name"), { target: { value: "Mac" } });
    fireEvent.click(screen.getByLabelText("windows")); fireEvent.click(screen.getByLabelText("linux"));
    fireEvent.click(screen.getByRole("button", { name: "Save Keymap" }));
    await waitFor(() => expect(updateKeymapMock).toHaveBeenCalledWith("keymap-1", { title: "Mac", platforms: ["macos"] }, { id: "user-1" }));
    const state = mockUseCustomizations() as Record<string, unknown>;
    mockUseCustomizations.mockReturnValue({ ...state, customizations: JSON.parse(JSON.stringify(state.customizations)) });
    rerender(<MyShortcutAppContent slug="local-tool" />);
    expect((screen.getByLabelText("App Name") as HTMLInputElement).value).toBe("Unsaved metadata");
  });
  it("renames sections and corrects, reorders, and removes existing shortcut rows", async () => {
    const state = mockUseCustomizations() as { customizations: { customApps: { keymaps: { sections: { shortcuts: unknown[] }[] }[] }[] } };
    state.customizations.customApps[0].keymaps[0].sections[0].shortcuts = [
      { id: "one", title: "Copy", key: "cmd+c", sortOrder: 0, isDeleted: false },
      { id: "two", title: "Paste", key: "cmd+v", sortOrder: 1, isDeleted: false },
    ];
    render(<MyShortcutAppContent slug="local-tool" />);
    fireEvent.change(screen.getByLabelText("Section name"), { target: { value: "Editing" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Section" }));
    await waitFor(() => expect(updateSectionMock).toHaveBeenCalledWith("section-1", { title: "Editing", sortOrder: 0 }, { id: "user-1" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Move Copy down" }).hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Move Copy down" }));
    await waitFor(() => expect(reorderMock).toHaveBeenCalledWith("shortcuts", ["two", "one"], { id: "user-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Copy" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Copy Selection" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Shortcut" }).hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Save Shortcut" }));
    await waitFor(() => expect(updateShortcutMock).toHaveBeenCalledWith("one", expect.objectContaining({ title: "Copy Selection", key: "cmd+c" }), { id: "user-1" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Delete Shortcut" }).hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Delete Shortcut" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }));
    await waitFor(() => expect(deleteShortcutMock).toHaveBeenCalledWith("one", { id: "user-1" }));
  }, 15000);

});
