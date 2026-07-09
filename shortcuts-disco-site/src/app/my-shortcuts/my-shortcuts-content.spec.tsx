import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const createCustomAppMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const deleteCustomAppMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const refetchMock = jest.fn<() => Promise<void>>();

jest.mock("next/navigation", () => ({
  __esModule: true,
  useSearchParams: () => new URLSearchParams(),
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
    createCustomApp: createCustomAppMock,
    deleteCustomApp: deleteCustomAppMock,
  },
}));

const { MyShortcutsContent } =
  require("./my-shortcuts-content") as typeof import("./my-shortcuts-content");

describe("MyShortcutsContent", () => {
  beforeEach(() => {
    createCustomAppMock.mockReset();
    createCustomAppMock.mockResolvedValue({});
    deleteCustomAppMock.mockReset();
    deleteCustomAppMock.mockResolvedValue(undefined);
    refetchMock.mockReset();
    refetchMock.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { id: "user-1" },
      isLoading: false,
    });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        customApps: [],
        customKeymaps: [],
        shortcuts: [],
        favorites: [],
      },
      isLoading: false,
      refetch: refetchMock,
    });
  });

  it("creates custom apps with an arbitrary image path", async () => {
    render(<MyShortcutsContent />);

    fireEvent.click(screen.getByRole("button", { name: "New App" }));
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "Local Tool" },
    });
    fireEvent.change(screen.getByLabelText("Image path"), {
      target: { value: "/custom-icons/local-tool.png" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));

    await waitFor(() =>
      expect(createCustomAppMock).toHaveBeenCalledWith(
        {
          name: "Local Tool",
          slug: "local-tool",
          bundleId: undefined,
          icon: "/custom-icons/local-tool.png",
        },
        { id: "user-1" },
      ),
    );
  });
});
