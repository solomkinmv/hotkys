import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const updateCustomAppMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const createCustomShortcutMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
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
    createCustomShortcut: createCustomShortcutMock,
  },
}));

const { MyShortcutAppContent } =
  require("./my-shortcut-app-content") as typeof import("./my-shortcut-app-content");

describe("MyShortcutAppContent", () => {
  beforeEach(() => {
    replaceMock.mockClear();
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
          hostname: undefined,
          source: undefined,
          icon: "https://cdn.example.com/local-tool.svg",
        },
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
});
