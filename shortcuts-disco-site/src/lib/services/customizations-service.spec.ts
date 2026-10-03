import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const clientProvider = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClientOrNull: clientProvider,
}));
jest.mock("./current-profile", () => ({
  getCurrentProfile: async () => ({ id: "profile-1" }),
  requireCurrentProfile: async () => ({ id: "profile-1" }),
}));
const { CustomizationsService } =
  require("./customizations-service") as typeof import("./customizations-service");
const row = {
  id: "app-1",
  user_id: "profile-1",
  name: "My Editor",
  slug: "my-editor",
  bundle_id: "com.microsoft.VSCode",
  windows_app_id: "Vendor.Package!App",
  windows_process_name: "Code",
  custom_keymaps: [],
};

describe("custom app Windows metadata persistence", () => {
  beforeEach(() => {
    clientProvider.mockReset();
  });

  it("creates custom apps with both identifiers and maps the returned row", async () => {
    const insert = jest.fn((_values: Record<string, unknown>) => ({
      select: () => ({ single: async () => ({ data: row, error: null }) }),
    }));
    clientProvider.mockReturnValue({ from: () => ({ insert }) });
    const app = await new CustomizationsService().createCustomApp({
      name: row.name,
      slug: row.slug,
      bundleId: row.bundle_id,
      windowsAppId: row.windows_app_id,
      windowsProcessName: row.windows_process_name,
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "profile-1",
        windows_app_id: row.windows_app_id,
        windows_process_name: row.windows_process_name,
      }),
    );
    expect(app).toMatchObject({
      windowsAppId: row.windows_app_id,
      windowsProcessName: row.windows_process_name,
    });
  });

  it.each([
    { windowsAppId: "Other.Editor!App", windowsProcessName: "Editor" },
    { windowsAppId: null, windowsProcessName: null },
    { name: "Renamed" },
  ])(
    "updates or clears identifiers without overwriting omitted fields %j",
    async (updates) => {
      const scoped = jest.fn(async (_column: string, _value: string) => ({
        error: null,
      }));
      const eq = jest.fn((_column: string, _value: string) => ({ eq: scoped }));
      const update = jest.fn((_values: Record<string, unknown>) => ({ eq }));
      clientProvider.mockReturnValue({ from: () => ({ update }) });
      await new CustomizationsService().updateCustomApp("app-1", updates);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          windows_app_id:
            "windowsAppId" in updates ? updates.windowsAppId : undefined,
          windows_process_name:
            "windowsProcessName" in updates
              ? updates.windowsProcessName
              : undefined,
        }),
      );
      expect(eq).toHaveBeenCalledWith("id", "app-1");
      expect(scoped).toHaveBeenCalledWith("user_id", "profile-1");
    },
  );

  it("includes identifiers when reloading custom apps", async () => {
    clientProvider.mockReturnValue({
      from: (table: string) => ({
        select: () => ({
          eq: () => {
            const result = {
              data: table === "custom_apps" ? [row] : [],
              error: null,
            };
            return { ...result, not: async () => result };
          },
        }),
      }),
    });
    const data = await new CustomizationsService().getAllCustomizations();
    expect(data.customApps[0]).toMatchObject({
      windowsAppId: row.windows_app_id,
      windowsProcessName: row.windows_process_name,
    });
  });

  it("rejects executable paths before creating a database client", async () => {
    await expect(
      new CustomizationsService().createCustomApp({
        name: "My Editor",
        slug: "my-editor",
        windowsProcessName: "C:\\Code.exe",
      }),
    ).rejects.toThrow("Windows process name");
    expect(clientProvider).not.toHaveBeenCalled();
  });
});
