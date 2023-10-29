import { useParams } from "react-router-dom";
import { useShortcutsProvider } from "../../core/load/shortcuts-provider";
import { AppShortcuts, SectionShortcut } from "../../core/model/internal/internal-models";
import { modifierSymbols } from "../../core/model/internal/modifiers";
import { Divider, Flex, List, Menu, MenuProps, Typography } from "antd";
import { AppstoreOutlined, MailOutlined, SettingOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Text, Link } = Typography;

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

const items: MenuItem[] = [
    getItem("Keymaps", "sub1", <MailOutlined />, [
        getItem("Option 1", "1"),
        getItem("Option 2", "2"),
        getItem("Option 3", "3"),
        getItem("Option 4", "4"),
    ]),
    getItem("Sections", "sub2", <AppstoreOutlined />, [
        getItem("Option 5", "5"),
        getItem("Option 6", "6"),
        getItem("Submenu", "sub3", null, [getItem("Option 7", "7"), getItem("Option 8", "8")]),
    ]),
    getItem("Navigation Three", "sub4", <SettingOutlined />, [
        getItem("Option 9", "9"),
        getItem("Option 10", "10"),
        getItem("Option 11", "11"),
        getItem("Option 12", "12"),
    ]),
];

// submenu keys of first level
const rootSubmenuKeys = ["sub1", "sub2", "sub4"];

export function AppShortcutsComponent() {
    let { bundleId } = useParams();
    const appShortcuts = useShortcutsProvider().getShortcutsByApp(bundleId!);
    const [openKeys, setOpenKeys] = useState(["keymaps", "sections"]);
    const menu = appShortcuts ? buildMenu(appShortcuts) : [];
    const [selectedKeymap, setSelectedKeymap] = useState(appShortcuts?.keymaps[0]!);
    const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey!) === -1) {
            setOpenKeys(keys);
        } else {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
    };

    return (
        <Flex>
            <Menu
                mode="inline"
                openKeys={openKeys}
                onOpenChange={onOpenChange}
                style={{ width: 256 }}
                items={menu}
            />
            <div>
                <h1>{appShortcuts?.name}</h1>
                <div>{appShortcuts?.bundleId}</div>
                {
                    selectedKeymap.sections.map(section => (
                        <div>
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
        </Flex>
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
