import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom/jest-globals";
import { fireEvent, render, screen } from "@testing-library/react";
import type { UserCustomizations } from "@/lib/model/user/user-models";

const user = { id: "user-1" };
let mockSearchParams = new URLSearchParams();
let saved: UserCustomizations;

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({ user, isLoading: false }),
}));
// Keep the real hook and editor; replace only persistence with detached snapshots.
jest.mock("@/lib/services/customizations-service", () => ({
  customizationsService: {
    getAllCustomizations: async () => JSON.parse(JSON.stringify(saved)),
    createCustomKeymap: async () => {
      saved.customApps[0].keymaps.push({
        id: "keymap-1",
        customAppId: "app-1",
        title: "Default",
        sections: [],
      });
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

const { MyShortcutsContent } =
  require("./my-shortcuts-content") as typeof import("./my-shortcuts-content");

describe("My Shortcuts navigation", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
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

  it("refreshes summary counts after adding content in the editor and returning without a page reload", async () => {
    const { rerender } = render(<MyShortcutsContent />);
    expect(
      await screen.findByText("0 keymap(s) • 0 shortcut(s)"),
    ).toBeInTheDocument();

    mockSearchParams = new URLSearchParams("app=local-tool");
    rerender(<MyShortcutsContent />);
    fireEvent.change(await screen.findByPlaceholderText("Keymap title"), {
      target: { value: "Default" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(await screen.findByPlaceholderText("Section title"), {
      target: { value: "General" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Section" }));
    fireEvent.change(await screen.findByPlaceholderText("Shortcut title"), {
      target: { value: "Focus address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Shortcut" }));
    expect(await screen.findByText("Focus address")).toBeInTheDocument();

    mockSearchParams = new URLSearchParams();
    rerender(<MyShortcutsContent />);
    expect(
      await screen.findByText("1 keymap(s) • 1 shortcut(s)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("0 keymap(s) • 0 shortcut(s)"),
    ).not.toBeInTheDocument();
  });
});
