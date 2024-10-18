"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppShortcuts } from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";
import { KeyboardBadge } from "@/components/ui/keyboard-badge";
import { InputProps } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/search-bar";
import { LinkableListItem } from "@/components/ui/list";
import { HeaderCompact1 } from "@/components/ui/typography";

export const ApplicationList = ({
  applications,
}: {
  applications: AppShortcuts[];
}) => {
  const [appShortcuts, setAppShortcuts] = useState(applications);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const fuse = new Fuse(applications, {
    keys: ["name"],
    includeScore: true,
    includeMatches: true,
  });

  const onChange: InputProps["onChange"] = (e) => {
    const inputText = e.currentTarget.value;
    if (!inputText) {
      setAppShortcuts(applications);
    } else {
      setAppShortcuts(
        fuse.search(e.currentTarget.value).map((result) => result.item),
      );
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % appShortcuts.length;
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
            (prevIndex - 1 + appShortcuts.length) % appShortcuts.length;
          itemRefs.current[newIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return newIndex;
        });
      } else if (e.key === "Enter") {
        const selectedApp = appShortcuts[selectedIndex];
        if (selectedApp) {
          window.location.href = `/apps/${selectedApp.slug}`;
        }
      } else if (e.key === "Escape") {
        setSelectedIndex(-1);
      }
    },
    [appShortcuts, selectedIndex],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [appShortcuts, handleKeyDown, selectedIndex]);

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
