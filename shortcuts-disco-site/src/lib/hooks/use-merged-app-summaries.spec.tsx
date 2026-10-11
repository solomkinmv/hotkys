import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";
import type {
  CustomApp,
  UserCustomizations,
} from "@/lib/model/user/user-models";
import { summarizeApps } from "@/lib/model/internal/app-summary";

const mockUseAuth = jest.fn();
const mockUseCustomizations = jest.fn();
const mockLoadPublicCatalog = jest.fn<() => Promise<AppShortcuts[]>>();
jest.mock("@/components/auth/auth-provider", () => ({ useAuth: mockUseAuth }));
jest.mock("@/lib/hooks/use-customizations", () => ({
  useCustomizations: mockUseCustomizations,
}));
jest.mock("@/lib/load/public-catalog", () => ({
  loadPublicCatalog: mockLoadPublicCatalog,
}));

const { useMergedAppSummaries } =
  require("./use-merged-app-summaries") as typeof import("./use-merged-app-summaries");

const catalog: AppShortcuts[] = [
  {
    name: "Sample",
    slug: "sample",
    keymaps: [
      {
        title: "Default",
        sections: [
          {
            title: "Editing",
            hotkeys: [
              { title: "Copy", sequence: [] },
              { title: "Paste", sequence: [] },
            ],
          },
        ],
      },
    ],
  },
];
const summaries = summarizeApps(catalog);
const emptyCustomizations: UserCustomizations = {
  customApps: [],
  customKeymaps: [],
  shortcuts: [],
  favorites: [],
};
const customApp: CustomApp = {
  id: "private-id",
  userId: "user-1",
  name: "My Tool",
  slug: "my-tool",
  keymaps: [],
};

describe("useMergedAppSummaries", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseCustomizations.mockReturnValue({
      customizations: emptyCustomizations,
    });
    mockLoadPublicCatalog.mockResolvedValue(catalog);
  });

  it("returns server summaries for signed-out visitors without loading the catalog", () => {
    const { result } = renderHook(() => useMergedAppSummaries(summaries));
    expect(result.current.applications).toBe(summaries);
    expect(mockLoadPublicCatalog).not.toHaveBeenCalled();
  });

  it("appends private apps without loading the catalog", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseCustomizations.mockReturnValue({
      customizations: { ...emptyCustomizations, customApps: [customApp] },
    });
    const { result } = renderHook(() => useMergedAppSummaries(summaries));
    expect(result.current.applications).toEqual([
      ...summaries,
      {
        name: "My Tool",
        slug: "custom-my-tool",
        customAppId: "private-id",
        keymaps: [],
      },
    ]);
    expect(mockLoadPublicCatalog).not.toHaveBeenCalled();
  });

  it("loads and merges the full catalog when overlays change public apps", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } });
    mockUseCustomizations.mockReturnValue({
      customizations: {
        ...emptyCustomizations,
        shortcuts: [
          {
            baseKey: "sample:Default:Editing:Paste",
            modification: { id: "overlay-1", isDeleted: true },
          },
        ],
      },
    });
    const { result } = renderHook(() => useMergedAppSummaries(summaries));
    expect(result.current.applications).toEqual(summaries);
    await waitFor(() =>
      expect(result.current.applications[0].keymaps[0].shortcutCount).toBe(1),
    );
    expect(mockLoadPublicCatalog).toHaveBeenCalledTimes(1);
  });
});
