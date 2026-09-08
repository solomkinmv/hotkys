import { customAppHref } from "./shortcut-routes";
it("preserves a raw private slug beginning with custom-", () => {
  expect(customAppHref("custom-tools")).toBe("/my-shortcuts?app=custom-tools");
});
