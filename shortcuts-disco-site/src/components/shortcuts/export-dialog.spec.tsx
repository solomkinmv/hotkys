import { it, expect, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExportDialog } from "./export-dialog";
import type { CustomApp } from "@/lib/model/user/user-models";
const app: CustomApp = { id: "draft", userId: "owner", name: "Sample", slug: "sample", keymaps: [{ id: "map", title: "Default", sections: [{ id: "section", keymapId: "map", title: "General", sortOrder: 0, shortcuts: [{ id: "shortcut", title: "Copy", key: "cmd+c", sortOrder: 0, isDeleted: false }] }] }] };
it("offers honest contribution links and a download fallback when clipboard access fails", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn<() => Promise<void>>().mockRejectedValue(new Error("Denied")) } });
  render(<ExportDialog app={app} open onOpenChange={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Download the JSON"));
  expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Open Contribution Guide" }).getAttribute("href")).toContain("/blob/main/CONTRIBUTING.md");
  expect(screen.getByRole("link", { name: "Report an Issue" }).getAttribute("href")).toContain("/issues/new");
});
it("shows the invalid draft location without offering invalid JSON", () => {
  render(<ExportDialog app={{ ...app, keymaps: [{ ...app.keymaps[0], sections: [] }] }} open onOpenChange={jest.fn()} />);
  expect(screen.getByRole("alert").textContent).toContain("Default");
  expect(screen.queryByRole("button", { name: "Copy JSON" })).toBeNull();
});
