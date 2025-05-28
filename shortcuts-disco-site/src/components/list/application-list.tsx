"use client";

import React, { useState } from "react";
import { AppShortcuts } from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";
import { KeyboardBadge } from "@/components/ui/keyboard-badge";
import { InputProps } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/search-bar";
import { LinkableListItem } from "@/components/ui/list";
import { HeaderCompact1 } from "@/components/ui/typography";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";

/**
 * ApplicationList component displays a searchable, keyboard-navigable list of applications
 * 
 * @param applications Array of application shortcuts to display
 */
export const ApplicationList = ({
  applications,
}: {
  applications: AppShortcuts[];
}) => {
  // State for filtered applications
  const [appShortcuts, setAppShortcuts] = useState(applications);

  // Setup fuzzy search with Fuse.js
  const fuse = new Fuse(applications, {
    keys: ["name"],
    includeScore: true,
    includeMatches: true,
  });

  // Use custom hook for keyboard navigation
  const { selectedIndex, itemRefs } = useKeyboardNavigation<AppShortcuts>(
    appShortcuts,
    undefined,
    (app) => `/apps/${app.slug}`
  );

  // Handle search input changes
  const onChange: InputProps["onChange"] = (e) => {
    const inputText = e.currentTarget.value;
    if (!inputText) {
      setAppShortcuts(applications);
    } else {
      setAppShortcuts(
        fuse.search(inputText).map((result) => result.item),
      );
    }
  };

  return (
    <>
      <HeaderCompact1 className="mt-0 mb-1">All Applications</HeaderCompact1>
      <SearchBar onChange={onChange} />
      <div className="mt-2">
        {appShortcuts.map((app, index) => (
          <LinkableListItem
            key={app.slug}
            to={`/apps/${app.slug}`}
            selected={index === selectedIndex}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            <span>{app.name}</span>
            <KeyboardBadge base={app.bundleId} />
          </LinkableListItem>
        ))}
      </div>
    </>
  );
};
