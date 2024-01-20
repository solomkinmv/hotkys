"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input, InputProps, InputRef, List, Tag, Typography} from "antd";
import { AppShortcuts } from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";

const { Text, Link } = Typography;

export const ApplicationList = (
  {
    applications,
  }: {
    applications: AppShortcuts[];
  }) => {

  const inputRef = useRef<InputRef>(null);
  const [searchShortcutVisible, setSearchShortcutVisible] = useState(true);
  const [appShortcuts, setAppShortcuts] = useState(applications);

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

  const fuse = new Fuse(applications, { keys: ["name"] });
  const onChange: InputProps["onChange"] = (e) => {
    const inputText = e.currentTarget.value;
    if (!inputText) {
      setAppShortcuts(applications);
    } else {
      setAppShortcuts(fuse.search(e.currentTarget.value).map(result => result.item));
    }
  };

  return (
    <div>
      <Input allowClear
             placeholder="Search..."
             onChange={onChange}
             style={{ marginTop: "15px" }}
             ref={inputRef}
             suffix={<Tag style={{ opacity: 0.5, display: searchShortcutVisible ? "block" : "none" }}>⌘K</Tag>}
             onBlur={() => setSearchShortcutVisible(true)}
             onFocus={() => setSearchShortcutVisible(false)}
      />
      <List
        dataSource={appShortcuts}
        renderItem={(app) => <List.Item>
          <Link href={`/apps/${app.slug}`}>{app.name}</Link><Text code hidden={!app.bundleId}>{app.bundleId}</Text>
        </List.Item>}
      />
    </div>
  );
};
