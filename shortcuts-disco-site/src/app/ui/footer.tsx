"use client";

import { Divider, Space, Typography } from "antd";
import React from "react";

const { Text, Link } = Typography;

export const Footer = () => (
  <div className="footer">
    <Divider />
    <Space split={<Divider type="vertical" />}>
      <Text type="secondary">Made by <Link href="https://solomk.in" target="_blank" color="red">Maksym
        Solomkin</Link></Text>
      <Link href="https://github.com/solomkinmv/shortcuts-disco/issues" target="_blank">Report issues or make a
        request</Link>
    </Space>
  </div>
);
