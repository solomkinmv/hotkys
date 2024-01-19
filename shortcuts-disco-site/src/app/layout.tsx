import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/app/ui/globals.css";
import { Header } from "@/app/ui/header";
import { Footer } from "@/app/ui/footer";

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
