import { Action, ActionPanel, List, useNavigation } from "@raycast/api";
import AppShortcuts from "./app-shortcuts";
import useAllShortcuts from "./load/shortcuts-provider";
import { removeHiddenBundleId } from "./model/internal/bundle-id-remover";

export default function AllShortcutsCommand() {
  const { push } = useNavigation();
  const { isLoading, shortcuts } = useAllShortcuts();
  return (
    <List isLoading={isLoading}>
      {shortcuts.applications.map((application) => {
        return (
          <List.Item
            key={application.bundleId}
            title={application.name}
            subtitle={removeHiddenBundleId(application.bundleId)}
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
