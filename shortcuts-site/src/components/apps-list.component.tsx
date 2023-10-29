import { useShortcutsProvider } from "../core/load/shortcuts-provider";
import { Link } from "react-router-dom";

export function AppsListComponent() {
    const shortcutsProvider = useShortcutsProvider();
    return (
        <div>
            {
                shortcutsProvider.getShortcuts().applications.map(app =>
                    <div><Link to={`/apps/${app.bundleId}`}>{app.name}</Link></div>
                )
            }
        </div>
    );
}
