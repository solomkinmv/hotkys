import React, { InputHTMLAttributes, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  // Add other props here if needed
}

const SearchBar = ({ onChange, ...props }: SearchBarProps) => {
  const inputRef = React.createRef<HTMLInputElement>();
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (event.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [inputRef]);

  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        className="w-full pl-9 pr-16"
        placeholder="Search"
        type="search"
        onChange={onChange}
        ref={inputRef}
        {...props}
      />
      <KbdGroup className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </div>
  );
};

SearchBar.displayName = "SearchBar";
export { SearchBar };
