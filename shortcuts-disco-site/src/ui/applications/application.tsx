"use client";

import {Divider, Input, InputProps, InputRef, List, Menu, MenuProps, Tag, Typography} from "antd";
import {AppstoreOutlined, SettingOutlined} from "@ant-design/icons";
import React, {useEffect, useRef, useState} from "react";
import Fuse from "fuse.js";
import "./application.css";
import { AppShortcuts, Keymap, Section, SectionShortcut } from "@/lib/model/internal/internal-models";
import useWindowDimensions from "@/lib/hooks/useWindowDimensions";
import { modifierMapping, modifierSymbols } from "@/lib/model/internal/modifiers";

const {Text} = Typography;

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

function buildFuse(selectedKeymap: Keymap) {
  return new Fuse(selectedKeymap.sections, {
    keys: [
      "title", "hotkeys.title", "hotkeys.sequence.base", "hotkeys.sequence.modifiers",
    ],
  });
}

const MOBILE_VIEW_THRESHOLD = 600;

export function AppShortcutsComponent({
                                        application,
                                      }: {
  application: AppShortcuts;
}) {

  const inputRef = useRef<InputRef>(null);
  const [searchShortcutVisible, setSearchShortcutVisible] = useState(true);
  const [openKeys, setOpenKeys] = useState(["keymaps", "sections"]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([application.keymaps[0]!.title!]);
  const [menu] = useState<MenuItem[]>(buildMenu(application));
  const [selectedKeymap, setSelectedKeymap] = useState<Keymap>(application.keymaps[0]);
  const [filteredSections, setFilteredSections] = useState<Section[]>(application.keymaps[0].sections);
  const [fuse, setFuse] = useState<Fuse<Section>>(buildFuse(application.keymaps[0]));
  const {width} = useWindowDimensions();

  useEffect(() => {
    if (width > MOBILE_VIEW_THRESHOLD) {
      setOpenKeys(["keymaps", "sections"]);
      setSearchShortcutVisible(true);
    } else {
      setOpenKeys([]);
      setSearchShortcutVisible(false);
    }
  }, [width]);


  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "k") {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys);
  };

  const calculateFilteredSections = (keymap: Keymap, filterText?: string): Section[] => {
    if (!filterText) {
      return keymap.sections;
    }
    return fuse?.search(filterText)?.map(result => result.item) ?? [];
  };

  const onSelect: MenuProps["onSelect"] = (event) => {
    const category = event.keyPath[event.keyPath.length - 1];
    if (category === "keymaps") {
      const newSelectedKeymapName = event.keyPath[0];
      const newSelectedKeymap = application?.keymaps.find(keymap => keymap.title === newSelectedKeymapName)!;
      setSelectedKeymap(newSelectedKeymap);
      setFilteredSections(calculateFilteredSections(newSelectedKeymap));
      setSelectedKeys([newSelectedKeymapName]);
      setFuse(buildFuse(newSelectedKeymap));
    }
    if (category === "sections") {
      const element = document.getElementById(event.key);
      if (element) {
        element.scrollIntoView({behavior: "smooth"});
      }
    }
  };

  const onChange: InputProps["onChange"] = (e) => {
    if (selectedKeymap) {
      setFilteredSections(calculateFilteredSections(selectedKeymap, e.currentTarget.value));
    }
  };

  return (
    <div className="container">
      <div className="sidebar-menu">
        <Menu
          mode={width > MOBILE_VIEW_THRESHOLD ? "inline" : "horizontal"}
          openKeys={openKeys}
          selectedKeys={selectedKeys}
          onOpenChange={onOpenChange}
          items={menu}
          onSelect={onSelect}
        />
      </div>
      <div className="content">
        <Typography.Title level={1} style={{margin: 0}}>
          {application?.name}
        </Typography.Title>
        <Text code hidden={!application?.bundleId}>{application?.bundleId}</Text>

        <Input allowClear
               placeholder="Search..."
               onChange={onChange}
               className="search-bar"
               ref={inputRef}
               suffix={<Tag style={{opacity: 0.5, display: searchShortcutVisible ? "block" : "none"}}>⌘K</Tag>}
               onBlur={() => setSearchShortcutVisible(true)}
               onFocus={() => setSearchShortcutVisible(false)}
        />

        {
          filteredSections.map(section => (
            <div key={section.title} id={section.title}>
              <Divider orientation="left">{section.title}</Divider>
              <List
                dataSource={section.hotkeys}
                renderItem={(sectionShortcut) =>
                  <List.Item>
                    <div>
                      {sectionShortcut.title}
                      {sectionShortcut.sequence.length > 0 ?
                        <Text code>{generateHotkeyText(sectionShortcut)}</Text> : null}
                    </div>
                    <Text type="secondary">{generateCommentText(sectionShortcut.comment)}</Text>
                  </List.Item>
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
    getItem("Keymaps", "keymaps", <SettingOutlined/>, keymapSubItems),
    getItem("Sections", "sections", <AppstoreOutlined/>, sections),

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

function generateCommentText(optionalComment: string | undefined): string | undefined {
  if (optionalComment === undefined) {
    return undefined;
  }
  let comment = optionalComment;
  modifierMapping.forEach((modifier, text) => {
    comment = comment.replace("{" + text + "}", modifierSymbols.get(modifier) ?? "");
  });
  baseKeySymbolOverride.forEach((text, symbol) => {
    comment = comment.replace("{" + text + "}", symbol);
  });
  return comment;
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
  ["space", "Space"],
  ["capslock", "⇪"],
  ["backspace", "⌫"],
  ["tab", "⇥"],
  ["esc", "⎋"],
  ["enter", "↩"],
  ["cmd", "⌘"],
  ["ctrl", "⌃"],
  ["opt", "⌥"],
  ["shift", "⇧"],
]);

