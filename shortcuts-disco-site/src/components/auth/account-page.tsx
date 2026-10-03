"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CircleUserRound, Settings2, Star, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/profile", label: "Profile", icon: CircleUserRound },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/my-shortcuts", label: "My shortcuts", icon: Keyboard },
];

export function AccountPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <section className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Your account</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-9 grid min-w-0 gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Account navigation" className="flex flex-wrap gap-1 self-start rounded-2xl border bg-muted/30 p-2 lg:flex-col">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/profile" && pathname.startsWith("/profile/"));
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground", active && "bg-card text-foreground shadow-xs")}><Icon className="size-4" aria-hidden="true" />{label}<ArrowUpRight className="ml-auto hidden size-3.5 lg:block" aria-hidden="true" /></Link>;
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
