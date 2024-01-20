"use client";

import { Menu, MenuProps, Typography } from "antd";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

const { Link } = Typography;

const headerMenu: MenuProps["items"] = [
  {
    key: "/",
    label: <Link href="/">Shortcuts Disco</Link>,
  },
  {
    key: "/about",
    label: <Link href="/about">About</Link>,
  },
  {
    key: "/raycast-extension",
    label: <Link href="/raycast-extension">Raycast Extension</Link>,
  },
];

export const Header = () => {
  const pathname = usePathname();
  const selectedKeys = [pathname];
  return (
    <div>
      <Menu mode="horizontal"
            items={headerMenu}
            selectedKeys={selectedKeys}
            />
    </div>
  )
}
