import { useShortcutsProvider } from "../core/load/shortcuts-provider";
import { Link } from "react-router-dom";
import { Flex, List, Typography } from "antd";

const { Text } = Typography;

export function AppsListComponent() {
    const shortcutsProvider = useShortcutsProvider();
    return (
        <Flex justify="center">
            <div>
                <List
                    dataSource={shortcutsProvider.getShortcuts().applications}
                    renderItem={(app) => <List.Item>
                        <Link to={`/apps/${app.bundleId}`}>{app.name}</Link><Text code>{app.bundleId}</Text>
                    </List.Item>}
                />
            </div>
        </Flex>
    );
}
