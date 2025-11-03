import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook for keyboard navigation in lists
 * 
 * @param items Array of items to navigate through
 * @param onSelect Callback function when an item is selected (Enter key)
 * @param getItemUrl Function to get the URL for an item (for navigation)
 * @returns Object containing state and refs for keyboard navigation
 */
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect?: (item: T) => void,
  getItemUrl?: (item: T) => string
) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % items.length;
          itemRefs.current[newIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return newIndex;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex =
            (prevIndex - 1 + items.length) % items.length;
          itemRefs.current[newIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return newIndex;
        });
      } else if (e.key === "Enter") {
        const selectedItem = items[selectedIndex];
        if (selectedItem) {
          if (onSelect) {
            onSelect(selectedItem);
          } else if (getItemUrl) {
            window.location.href = getItemUrl(selectedItem);
          }
        }
      } else if (e.key === "Escape") {
        setSelectedIndex(-1);
      }
    },
    [items, selectedIndex, onSelect, getItemUrl]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    itemRefs,
  };
}
