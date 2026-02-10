import React from "react";
import { Inter as FontSans } from "next/font/google";
import "@/app/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Font configuration for the application
 */
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Metadata for the application
 */
export const metadata: Metadata = {
  title: {
    template: "%s | Hotkys",
    default: "Hotkys",
  },
  description: "Master keyboard shortcuts for 60+ popular apps. Free, searchable cheat sheets for macOS, Windows, and Linux productivity tools, design apps, and dev software.",
  metadataBase: new URL("https://hotkys.com"),
  openGraph: {
    type: "website",
    siteName: "Hotkys",
  },
  twitter: {
    card: "summary_large_image",
  },
};

/**
 * Root layout component for the application
 * Provides the basic structure for all pages including header, main content area, and footer
 */
const RootLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "flex flex-col min-h-screen bg-background text-foreground font-sans antialiased",
        fontSans.variable,
      )}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />

          <main className="flex-1 p-6 md:p-10">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
        <GoogleAnalytics gaId="G-RKBKYV49KC" />
      </body>
    </html>
  );
};

export default RootLayout;
