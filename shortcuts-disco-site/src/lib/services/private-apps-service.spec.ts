import { beforeEach, describe, expect, it, jest } from "@jest/globals";
const client = jest.fn<(...args: unknown[]) => unknown>();
const rpc = jest.fn<(...args: unknown[]) => Promise<{ error: unknown }>>();
const requireProfile =
  jest.fn<(...args: unknown[]) => Promise<{ id: string }>>();
jest.mock("@/lib/supabase/client", () => ({
  createClientOrNull: (...args: unknown[]) => client(...args),
}));
jest.mock("./current-profile", () => ({
  requireCurrentProfile: (...args: unknown[]) => requireProfile(...args),
}));
const { privateAppsService } =
  require("./private-apps-service") as typeof import("./private-apps-service");
const user = {
  id: "clerk-user",
  email: "test@example.com",
  displayName: null,
  avatarUrl: null,
};
beforeEach(() => {
  client.mockReset().mockReturnValue({ rpc });
  rpc.mockReset().mockResolvedValue({ error: null });
  requireProfile.mockReset().mockResolvedValue({ id: "profile" });
});
describe("private app service", () => {
  it("normalizes edits and retains source/destination IDs", async () => {
    await privateAppsService.updateShortcut(
      "app",
      "shortcut",
      { title: " Copy ", key: "cmd+shift+c", sectionId: "destination" },
      user,
    );
    expect(requireProfile).toHaveBeenCalledWith(user);
    expect(client).toHaveBeenCalledWith(user);
    expect(rpc).toHaveBeenCalledWith("private_app_mutate", {
      p_app_id: "app",
      p_entity: "shortcut",
      p_id: "shortcut",
      p_operation: "update",
      p_values: {
        title: "Copy",
        key: "shift+cmd+c",
        comment: null,
        section_id: "destination",
      },
    });
  });
  it("accepts instruction-only actions and clears previous keys", async () => {
    await privateAppsService.updateShortcut(
      "app",
      "shortcut",
      { title: "Reply", comment: "Double click" },
      user,
    );
    expect(rpc).toHaveBeenCalledWith(
      "private_app_mutate",
      expect.objectContaining({
        p_values: { title: "Reply", key: null, comment: "Double click" },
      }),
    );
  });
  it("rejects invalid drafts before any write", async () => {
    await expect(
      privateAppsService.updateShortcut("app", "s", { title: "Reply" }, user),
    ).rejects.toThrow();
    await expect(
      privateAppsService.updateKeymap("app", "k", { title: " " }, user),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("passes complete orders and mutation errors through", async () => {
    await privateAppsService.reorder(
      "app",
      "section",
      "keymap",
      ["b", "a"],
      user,
    );
    expect(rpc).toHaveBeenCalledWith("private_app_reorder", {
      p_app_id: "app",
      p_entity: "section",
      p_parent_id: "keymap",
      p_ordered_ids: ["b", "a"],
    });
    const error = new Error("Private item not found");
    rpc.mockResolvedValueOnce({ error });
    await expect(
      privateAppsService.deleteSection("app", "section", user),
    ).rejects.toBe(error);
  });
});
