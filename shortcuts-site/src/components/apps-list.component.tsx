import { useShortcutsProvider } from "../core/load/shortcuts-provider";
import { Link } from "react-router-dom";
import { Flex, Layout } from "antd";
import Sider from "antd/es/layout/Sider";
import { Content } from "antd/es/layout/layout";
import Search from "antd/es/input/Search";

export function AppsListComponent() {
    const shortcutsProvider = useShortcutsProvider();
    return (
        <Flex>
            <div>Sidebar will be here</div>
            <div>
                {
                shortcutsProvider.getShortcuts().applications.map(app =>
                    <div><Link to={`/apps/${app.bundleId}`}>{app.name}</Link></div>,
                )
            }
            </div>
        </Flex>
    );
}
