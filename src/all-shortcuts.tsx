import { ActionPanel, List, Action, useNavigation } from "@raycast/api";
import { hotkeys } from "./model/hotkeys";
import AppShortcuts from "./app-shortcuts";

export default function AllShortcutsCommand() {
  const { push } = useNavigation();
  return (
    <List>
      {hotkeys.applications.map((application) => {
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
