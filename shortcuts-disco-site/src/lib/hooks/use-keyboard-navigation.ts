import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
export function shouldIgnorePageKeydown(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      Boolean(target.closest('[role="dialog"],button,a,input,select,textarea')))
  );
}
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect?: (item: T) => void,
  getItemUrl?: (item: T) => string,
  options?: { enabled?: boolean; resetKey?: string; scope?: "search" },
) {
  const key = options?.resetKey ?? String(items.length);
  const [selection, setSelection] = useState({ key, index: -1 });
  const selectedIndex =
    selection.key === key && selection.index < items.length
      ? selection.index
      : -1;
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scopeRef = useRef<HTMLDivElement>(null);
  const setSelectedIndex: Dispatch<SetStateAction<number>> = useCallback(
    (value) => {
      setSelection((previous) => ({
        key,
        index:
          typeof value === "function"
            ? value(previous.key === key ? previous.index : -1)
            : value,
      }));
    },
    [key],
  );
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        options?.enabled === false ||
        event.defaultPrevented ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (options?.scope === "search") {
        if (
          !(event.target instanceof HTMLInputElement) ||
          event.target.type !== "search" ||
          !scopeRef.current?.contains(event.target)
        )
          return;
      } else if (shouldIgnorePageKeydown(event.target)) return;
      if (event.key === "Escape") {
        setSelectedIndex(-1);
        return;
      }
      if (!items.length) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const index =
          event.key === "ArrowDown"
            ? (selectedIndex + 1) % items.length
            : selectedIndex < 0
              ? items.length - 1
              : (selectedIndex - 1 + items.length) % items.length;
        setSelectedIndex(index);
        itemRefs.current[index]?.scrollIntoView({
          behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "nearest",
        });
      } else if (event.key === "Enter" && selectedIndex >= 0) {
        if (onSelect) {
          event.preventDefault();
          onSelect(items[selectedIndex]);
        } else if (getItemUrl) {
          event.preventDefault();
          window.location.href = getItemUrl(items[selectedIndex]);
        }
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [
    items,
    selectedIndex,
    onSelect,
    getItemUrl,
    options?.enabled,
    options?.scope,
    setSelectedIndex,
  ]);
  return { selectedIndex, setSelectedIndex, itemRefs, scopeRef };
}
