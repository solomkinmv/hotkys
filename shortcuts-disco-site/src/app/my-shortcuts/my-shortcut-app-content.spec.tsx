import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const replaceMock = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const updateCustomAppMock = jest.fn<(...args: unknown[]) => Promise<void>>();
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
  },
}));

const { MyShortcutAppContent } =
  require("./my-shortcut-app-content") as typeof import("./my-shortcut-app-content");

describe("MyShortcutAppContent", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    updateCustomAppMock.mockReset();
    updateCustomAppMock.mockResolvedValue(undefined);
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
            keymaps: [],
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
});
