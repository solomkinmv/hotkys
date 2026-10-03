"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { MAIN_NAV_LINKS } from "@/lib/constants/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#applications", label: "Apps" },
  { href: "/favorites", label: "Favorites" },
  { href: "/my-shortcuts", label: "My shortcuts" },
  ...MAIN_NAV_LINKS,
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-4 px-5 xl:px-0">
        <Link href="/" aria-label="Hotkys home" className="shrink-0">
          <Image
            src="/hotkys-logo-300x166.png"
            alt="Hotkys"
            width={76}
            height={42}
          />
        </Link>
        <nav
          aria-label="Main navigation"
          className="mr-auto ml-8 hidden items-center gap-7 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                (
                  link.href === "/#applications"
                    ? pathname === "/" || pathname.startsWith("/apps/")
                    : pathname === link.href
                )
                  ? "page"
                  : undefined
              }
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                (link.href === "/#applications"
                  ? pathname === "/" || pathname.startsWith("/apps/")
                  : pathname === link.href) && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-72">
              <SheetHeader>
                <SheetTitle>Hotkys</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1 px-4"
              >
                {links.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
