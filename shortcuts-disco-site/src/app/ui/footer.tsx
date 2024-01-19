import { Divider, Space } from "antd";
import Link from "next/link";
import React from "react";

export const Footer = () => (
  <div className="footer">
    <Divider />
    <Space split={<Divider type="vertical" />}>
      <span className={"text-gray-600"}>
        Made by <Link href="https://solomk.in" target="_blank" color="red">Maksym
        Solomkin</Link>
      </span>
      <Link href="https://github.com/solomkinmv/shortcuts-disco/issues" target="_blank">Report issues or make a
        request</Link>
    </Space>
  </div>
);
