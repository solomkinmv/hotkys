import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google"
import { Header } from "@/ui/header";
import { Footer } from "@/ui/footer";
import { ConfigProvider } from "antd";

const RootLayout = ({ children }: React.PropsWithChildren) => {

  return (
    <html lang="en">
    <body>
    <AntdRegistry>
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              activeBarBorderWidth: 0,
            },
            List: {
              // titleMarginBottom: 1,
              itemPadding: "12px 10px",
            },
          },
          token: {},
        }}
      >
        <div className="site-body">
          <Header />
          {children}
          <Footer />
        </div>
      </ConfigProvider>
    </AntdRegistry>
    </body>
    <GoogleAnalytics gaId="G-RKBKYV49KC" />
    </html>
  );
};

export default RootLayout;
