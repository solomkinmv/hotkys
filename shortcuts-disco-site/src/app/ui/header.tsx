"use client";

import { Menu, MenuProps } from "antd";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

const headerMenu: MenuProps["items"] = [
  {
    key: "home",
    label: "Shortcuts Disco",
  },
  {
    key: "about",
    label: "About",
  },
  {
    key: "raycast-extension",
    label: "RayCast Extension",
  },
];

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const lastPathElement = pathname.split("/").pop() ?? "";
  // const selectedKeys = ["home"];
  const selectedKeys = [lastPathElement === "" ? "home" : lastPathElement];
  return (
    <div>
      <Menu mode="horizontal"
            items={headerMenu}
            selectedKeys={selectedKeys}
            onClick={async (event) => {
              if (event.key === "home") {
                router.push("/");
              } else {
                router.push(`/${event.key}`);
              }
            }} />
    </div>
  )
}
