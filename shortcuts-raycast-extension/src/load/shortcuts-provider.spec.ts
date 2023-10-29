import useShortcutsProvider from "./shortcuts-provider";

test("Parses all shortcuts successfully", () => {
  useShortcutsProvider().getShortcuts();
});
