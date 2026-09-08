import { jest, it, expect, beforeEach } from "@jest/globals";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
it("keeps empty navigation finite and selects the last row on initial ArrowUp", () => {
  const view = renderHook(({ items }) => useKeyboardNavigation(items), { initialProps: { items: [] as string[] } });
  fireEvent.keyDown(window, { key: "ArrowDown" });
  expect(view.result.current.selectedIndex).toBe(-1);
  view.rerender({ items: ["a", "b"] });
  fireEvent.keyDown(window, { key: "ArrowUp" });
  expect(view.result.current.selectedIndex).toBe(1);
  view.rerender({ items: [] });
  expect(view.result.current.selectedIndex).toBe(-1);
});
it("does not capture editing controls and Enter selects the highlighted item", () => {
  const select = jest.fn();
  const view = renderHook(() => useKeyboardNavigation(["a"], select));
  const input = document.createElement("input"); document.body.appendChild(input);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(view.result.current.selectedIndex).toBe(-1);
  act(() => view.result.current.setSelectedIndex(0));
  fireEvent.keyDown(window, { key: "Enter" });
  expect(select).toHaveBeenCalledWith("a"); input.remove();
});
