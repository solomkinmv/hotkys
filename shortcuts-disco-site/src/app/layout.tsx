import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/ui/globals.css";
import { Header } from "@/ui/header";
import { Footer } from "@/ui/footer";

const RootLayout = ({ children }: React.PropsWithChildren) => {

  return (
    <html lang="en">
    <body>
    <AntdRegistry>
      <div className="site-body">
        <Header />
        {children}
        <Footer />
      </div>
    </AntdRegistry>
    </body>
    </html>
  );
};

export default RootLayout;
