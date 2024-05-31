import React, {InputHTMLAttributes, useEffect} from "react";
import {Input} from "@/components/ui/input";
import {SearchIcon} from "lucide-react";
import {KeyboardBadge} from "@/components/ui/keyboard-badge";

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
    // Add other props here if needed
}

const SearchBar = (
    {onChange, ...props}: SearchBarProps
) => {
    const inputRef = React.createRef<HTMLInputElement>();
    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if (event.metaKey && event.key === "k") {
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
        <div className="relative w-full rounded-md text-sm dark:border-0">
            <Input
                className="w-full pl-10"
                placeholder="Search"
                type="search"
                onChange={onChange}
                ref={inputRef}
                {...props}
            />
            <SearchIcon className="absolute h-5 w-5 text-gray-300 left-2.5 top-2.5 dark:text-gray-700"/>
            <KeyboardBadge
                tokens={["⌘", "K"]}
                className="absolute right-4 h-5 w-5 text-gray-300 top-2.5 dark:text-gray-700"
            />
        </div>
    );
};

SearchBar.displayName = "SearchBar";
export {SearchBar};
