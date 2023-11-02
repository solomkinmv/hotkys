import { useShortcutsProvider } from "../core/load/shortcuts-provider";
import { Link } from "react-router-dom";
import { Flex, Input, InputProps, List, Typography } from "antd";
import { useState } from "react";
import Fuse from "fuse.js";

const { Text } = Typography;

export function AppsListComponent() {
    const shortcutsProvider = useShortcutsProvider();
    const allAppShortcuts = shortcutsProvider.getShortcuts().applications;
    const [appShortcuts, setAppShortcuts] = useState(allAppShortcuts);

    const fuse = new Fuse(allAppShortcuts, { keys: ["name"] });
    const onChange: InputProps["onChange"] = (e) => {
        const inputText = e.currentTarget.value;
        if (!inputText) {
            setAppShortcuts(allAppShortcuts);
        } else {
            setAppShortcuts(fuse.search(e.currentTarget.value).map(result => result.item));
        }
    };

    return (
        <div>
            <div>
                <Input allowClear
                       placeholder="Search..."
                       onChange={onChange}
                />
                <List
                    dataSource={appShortcuts}
                    renderItem={(app) => <List.Item>
                        <Link to={`/apps/${app.bundleId}`}>{app.name}</Link><Text code>{app.bundleId}</Text>
                    </List.Item>}
                />
            </div>
        </div>
    );
}
