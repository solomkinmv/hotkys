import { Action, ActionPanel, List } from "@raycast/api";
import AppShortcuts from "./app-shortcuts";
import { useApps } from "./load/apps-provider";
import { getAvatarIcon, useFrecencySorting } from "@raycast/utils";
import { AppMetadata } from "./model/input/input-models";

function formatSubtitle(app: AppMetadata): string {
  return app.bundleId ?? app.hostname ?? "";
}

export default function AllShortcutsCommand() {
  const { isLoading, data: apps } = useApps();
  const { data: sortedApps, visitItem } = useFrecencySorting(apps, {
    key: (app) => app.slug,
  });

  return (
    <List isLoading={isLoading}>
      {sortedApps.map((app) => (
        <List.Item
          key={app.slug}
          icon={getAvatarIcon(app.name)}
          title={app.name}
          subtitle={formatSubtitle(app)}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Shortcuts"
                target={<AppShortcuts slug={app.slug} />}
                onPush={() => visitItem(app)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
