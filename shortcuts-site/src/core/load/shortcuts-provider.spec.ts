import { useShortcutsProvider } from "./shortcuts-provider";
import { act, renderHook } from '@testing-library/react';

test("Parses all shortcuts successfully", () => {
    const { result } = renderHook(() => useShortcutsProvider());

    act(() => {
        result.current.getShortcuts();
    });
});
