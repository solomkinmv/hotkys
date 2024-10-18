import { Action, ActionPanel, List, useNavigation } from "@raycast/api";
import AppShortcuts from "./app-shortcuts";
import useAllShortcuts from "./load/shortcuts-provider";
import { formatSubtitle } from "./model/internal/subtitle-formatter";
import { getAvatarIcon, useFrecencySorting } from "@raycast/utils";
import { useState, useEffect } from "react";

export default function AllShortcutsCommand() {
  const { push } = useNavigation();
  const { isLoading, data: shortcuts } = useAllShortcuts();
  const { data: sortedApplications, visitItem } = useFrecencySorting(shortcuts.applications, {
    key: (app) => app.slug,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prevIndex) => (prevIndex + 1) % sortedApplications.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prevIndex) => (prevIndex - 1 + sortedApplications.length) % sortedApplications.length);
    } else if (e.key === "Enter") {
      const selectedApp = sortedApplications[selectedIndex];
      if (selectedApp) {
        visitItem(selectedApp);
        push(<AppShortcuts app={selectedApp} />);
      }
    } else if (e.key === "Escape") {
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortedApplications, selectedIndex]);

  return (
    <List isLoading={isLoading}>
      {sortedApplications.map((app, index) => {
        return (
          <List.Item
            key={app.slug}
            icon={getAvatarIcon(app.name)}
            title={app.name}
            subtitle={formatSubtitle(app)}
            actions={
              <ActionPanel>
                <Action
                  title="Open"
                  onAction={async () => {
                    await visitItem(app);
                    push(<AppShortcuts app={app} />);
                  }}
                />
              </ActionPanel>
            }
            accessories={index === selectedIndex ? [{ text: "Selected", icon: "🔵" }] : []}
          />
        );
      })}
    </List>
  );
}
