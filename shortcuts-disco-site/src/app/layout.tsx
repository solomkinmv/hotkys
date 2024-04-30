import React from "react";
import { Inter as FontSans } from "next/font/google";
import "@/app/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});


export const metadata: Metadata = {
  title: {
    template: "%s | Hotkys",
    default: "Hotkys",
  },
  description: "Collection of useful shortcuts for different applications",
  metadataBase: new URL("https://hotkys.com"),
};

const RootLayout = ({ children }: React.PropsWithChildren) => {

  return (
    <html lang="en">
    <body className={cn(
      "flex flex-col min-h-screen bg-white dark:bg-gray-900 font-sans antialiased",
      fontSans.variable,
    )}>
    <Header />

    <main className="flex-1 p-6 md:p-10">
      {children}
    </main>

    <Footer />
    <GoogleAnalytics gaId="G-RKBKYV49KC" />
    </body>
    </html>
  );
};

export default RootLayout;
