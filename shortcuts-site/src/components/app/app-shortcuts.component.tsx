import { useParams } from "react-router-dom";
import { useShortcutsProvider } from "../../core/load/shortcuts-provider";
import { AppShortcuts, SectionShortcut } from "../../core/model/internal/internal-models";
import { modifierSymbols } from "../../core/model/internal/modifiers";
import { Divider, Input, InputProps, List, Menu, MenuProps, Typography } from "antd";
import { AppstoreOutlined, SettingOutlined } from "@ant-design/icons";
import { useState } from "react";
import Fuse from "fuse.js";
import "./app-shortcuts.component.css"

const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: "group",
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
        type,
    } as MenuItem;
}

export function AppShortcutsComponent() {
    let { bundleId } = useParams();
    const appShortcuts = useShortcutsProvider().getShortcutsByApp(bundleId!);
    const [openKeys, setOpenKeys] = useState(["keymaps", "sections"]);
    const [selectedKeys, setSelectedKeys] = useState([appShortcuts?.keymaps[0]!.title!]);
    const menu = appShortcuts ? buildMenu(appShortcuts) : [];
    const [selectedKeymap, setSelectedKeymap] = useState(appShortcuts?.keymaps[0]!);
    const [filteredSections, setFilteredSections] = useState(selectedKeymap.sections);
    const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
        setOpenKeys(keys);
    };

    const onSelect: MenuProps["onSelect"] = (event) => {
        const category = event.keyPath[event.keyPath.length - 1];
        if (category === "keymaps") {
            const selectedKeymap = event.keyPath[0];
            setSelectedKeymap(appShortcuts?.keymaps.find(keymap => keymap.title === selectedKeymap)!);
            setSelectedKeys([selectedKeymap]);
        }
    };

    const fuse = new Fuse(selectedKeymap.sections, {
        keys: [
            "title", "hotkeys.title", "hotkeys.sequence.base", "hotkeys.sequence.modifiers",
        ],
    });
    const onChange: InputProps["onChange"] = (e) => {
        const inputText = e.currentTarget.value;
        if (!inputText) {
            setFilteredSections(selectedKeymap.sections);
        } else {
            setFilteredSections(fuse.search(e.currentTarget.value).map(result => result.item));
        }
    };

    return (
        <div className="container">
            <div className="sidebar-menu">
                <Menu
                    mode="inline"
                    openKeys={openKeys}
                    selectedKeys={selectedKeys}
                    onOpenChange={onOpenChange}
                    items={menu}
                    onSelect={onSelect}
                />
            </div>
            <div className="content">
                <Typography.Title level={1} style={{ margin: 0 }}>
                    {appShortcuts?.name}
                </Typography.Title>
                <Text code>{appShortcuts?.bundleId}</Text>

                <Input allowClear
                       placeholder="Search..."
                       onChange={onChange}
                       className="search-bar"
                />

                {
                    filteredSections.map(section => (
                        <div key={section.title}>
                            <Divider orientation="left">{section.title}</Divider>
                            <List
                                dataSource={section.hotkeys}
                                renderItem={(sectionShortcut) =>
                                    <List.Item>{sectionShortcut.title}<Text
                                        code>{generateHotkeyText(sectionShortcut)}</Text></List.Item>
                                }
                            />
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

function buildMenu(appShortcuts: AppShortcuts): MenuItem[] {
    const keymapSubItems = appShortcuts.keymaps.map(keymap => getItem(keymap.title, keymap.title));
    const sections = appShortcuts.keymaps[0].sections.map(section => getItem(section.title, section.title));
    return [
        getItem("Keymaps", "keymaps", <SettingOutlined />, keymapSubItems),
        getItem("Sections", "sections", <AppstoreOutlined />, sections),

    ];
}

function generateHotkeyText(shortcut: SectionShortcut): string {
    return shortcut.sequence
        .map((atomicShortcut) => {
            const modifiersText = atomicShortcut.modifiers.map((modifier) => modifierSymbols.get(modifier)).join("") ?? "";
            return modifiersText + overrideSymbolIfPossible(atomicShortcut.base);
        })
        .join(" ");
}

function overrideSymbolIfPossible(base: string) {
    if (baseKeySymbolOverride.has(base)) {
        return baseKeySymbolOverride.get(base);
    }
    return base.toUpperCase();
}

const baseKeySymbolOverride: Map<string, string> = new Map([
    ["left", "←"],
    ["right", "→"],
    ["up", "↑"],
    ["down", "↓"],
    ["pageup", "PgUp"],
    ["pagedown", "PgDown"],
    ["home", "Home"],
    ["end", "End"],
    ["tab", "⇥"],
    ["esc", "⎋"],
]);
