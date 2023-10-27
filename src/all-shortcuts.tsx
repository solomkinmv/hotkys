import { Action, ActionPanel, List, useNavigation } from "@raycast/api";
import AppShortcuts from "./app-shortcuts";
import { shortcutsStorage } from "./shortcuts-storage/shortcuts-aggregator";

export default function AllShortcutsCommand() {
  const { push } = useNavigation();
  return (
    <List>
      {shortcutsStorage.applications.map((application) => {
        return (
          <List.Item
            icon="list-icon.png"
            key={application.bundleId}
            title={application.name}
            subtitle={application.bundleId}
            actions={
              <ActionPanel>
                <Action
                  title="Apply"
                  onAction={() => {
                    push(<AppShortcuts bundleId={application.bundleId} />);
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
