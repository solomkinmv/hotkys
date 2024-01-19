import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Divider, Space, Typography } from "antd";
import "@/app/ui/globals.css";
import { Header } from "@/app/ui/header";

const { Text, Link } = Typography;


const RootLayout = ({ children }: React.PropsWithChildren) => {

  return (
    <html lang="en">
    <body>
    <AntdRegistry>
      <div className="site-body">
        <Header />
        {children}
        <div className="footer">
          <Divider />
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">Made by <Link href="https://solomk.in" target="_blank" color="red">Maksym
              Solomkin</Link></Text>
            <Link href="https://github.com/solomkinmv/shortcuts-disco/issues" target="_blank">Report issues or make a
              request</Link>
          </Space>
        </div>
      </div>
    </AntdRegistry>
    </body>
    </html>
  );
};

export default RootLayout;
