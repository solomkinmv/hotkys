"use client";

import React from "react";
import { ConfigProvider } from "antd";

const withTheme = (node: React.JSX.Element) => (
  <>
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
      {node}
    </ConfigProvider>
  </>
);

export default withTheme;
