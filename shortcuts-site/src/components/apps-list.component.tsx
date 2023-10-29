import { useShortcutsProvider } from "../core/load/shortcuts-provider";

export function AppsListComponent() {
    const shortcutsProvider = useShortcutsProvider();
    return (
        <div>
            {
                shortcutsProvider.getShortcuts().applications.map(app =>
                    <div>{app.name}</div>,
                )
            }
        </div>
    );
}
