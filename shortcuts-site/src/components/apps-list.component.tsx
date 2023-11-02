import { useShortcutsProvider } from "../core/load/shortcuts-provider";
import { Link } from "react-router-dom";
import { Input, InputProps, InputRef, List, Tag, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import Fuse from "fuse.js";

const { Text } = Typography;

export function AppsListComponent() {
    const inputRef = useRef<InputRef>(null);
    const [searchShortcutVisible, setSearchShortcutVisible] = useState(true)
    const shortcutsProvider = useShortcutsProvider();
    const allAppShortcuts = shortcutsProvider.getShortcuts().applications;
    const [appShortcuts, setAppShortcuts] = useState(allAppShortcuts);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if (event.metaKey && event.key === 'k') {
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleShortcut);

        return () => {
            window.removeEventListener('keydown', handleShortcut);
        };
    }, []);

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
                       ref={inputRef}
                       suffix={<Tag style={{opacity: 0.5, display: searchShortcutVisible ? "block" : "none"}}>⌘K</Tag>}
                       onBlur={() => setSearchShortcutVisible(true)}
                       onFocus={() => setSearchShortcutVisible(false)}
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
