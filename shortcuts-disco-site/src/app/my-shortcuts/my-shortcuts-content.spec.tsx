import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const createCustomAppMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const deleteCustomAppMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const pushMock = jest.fn();
const refetchMock = jest.fn<() => Promise<void>>();

jest.mock("next/navigation", () => ({
  __esModule: true,
  usePathname: () => "/my-shortcuts",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: pushMock }),
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
    createCustomApp: createCustomAppMock,
    deleteCustomApp: deleteCustomAppMock,
  },
}));

const { MyShortcutsContent } =
  require("./my-shortcuts-content") as typeof import("./my-shortcuts-content");

describe("MyShortcutsContent", () => {
  beforeEach(() => {
    createCustomAppMock.mockReset();
    createCustomAppMock.mockResolvedValue({ slug: "local-tool" });
    pushMock.mockClear();
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
    fireEvent.click(screen.getByText("Icon and app details"));
    fireEvent.change(screen.getByLabelText("Image path"), {
      target: { value: "/custom-icons/local-tool.png" },
    });
    fireEvent.change(screen.getByLabelText("Windows app ID"), {
      target: { value: " Vendor.Package!App " },
    });
    fireEvent.change(screen.getByLabelText("Windows process name"), {
      target: { value: " Code " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));

    await waitFor(() =>
      expect(createCustomAppMock).toHaveBeenCalledWith(
        {
          name: "Local Tool",
          slug: "local-tool",
          bundleId: undefined,
          windowsAppId: "Vendor.Package!App",
          windowsProcessName: "Code",
          icon: "/custom-icons/local-tool.png",
        },
        { id: "user-1" },
      ),
    );
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/my-shortcuts?app=local-tool"),
    );
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
  it("waits for the created app to load before opening its editor", async () => {
    let finishRefresh!: () => void;
    refetchMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRefresh = resolve;
        }),
    );
    render(<MyShortcutsContent />);
    fireEvent.click(screen.getByRole("button", { name: "New App" }));
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "Local Tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => finishRefresh());
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/my-shortcuts?app=local-tool"),
    );
    expect(createCustomAppMock).toHaveBeenCalledTimes(1);
  });
  it("retries only the read when a created app cannot reload", async () => {
    refetchMock.mockRejectedValueOnce(new Error("Read interrupted"));
    render(<MyShortcutsContent />);
    fireEvent.click(screen.getByRole("button", { name: "New App" }));
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "Local Tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "App created, but couldn’t reload",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(createCustomAppMock).toHaveBeenCalledTimes(1);
  });
  it("keeps a manually edited slug when the app name changes", async () => {
    render(<MyShortcutsContent />);
    fireEvent.click(screen.getByRole("button", { name: "New App" }));
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "Local Tool" },
    });
    fireEvent.click(screen.getByText("Icon and app details"));
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "my-identifier" },
    });
    fireEvent.change(screen.getByLabelText("App Name"), {
      target: { value: "Renamed Tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create App" }));
    await waitFor(() =>
      expect(createCustomAppMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Renamed Tool",
          slug: "my-identifier",
        }),
        { id: "user-1" },
      ),
    );
  });
  it("only reloads after a successful delete followed by a failed read", async () => {
    const state = mockUseCustomizations() as {
      customizations: { customApps: unknown[] };
    };
    state.customizations.customApps = [
      { id: "private-1", name: "Local Tool", slug: "local-tool", keymaps: [] },
    ];
    refetchMock.mockRejectedValueOnce(new Error("Read interrupted"));
    render(<MyShortcutsContent />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Local Tool" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete app" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "App deleted",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(2));
    expect(deleteCustomAppMock).toHaveBeenCalledTimes(1);
  });
});
