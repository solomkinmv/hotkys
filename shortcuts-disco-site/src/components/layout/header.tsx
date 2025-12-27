"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GithubIcon, TwitterIcon, RaycastIcon } from "@/components/ui/icons";
import { MAIN_NAV_LINKS, SOCIAL_LINKS, NavIconKey } from "@/lib/constants/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HelpCircle } from "lucide-react";

const NAV_ICONS: Record<NavIconKey, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  Raycast: RaycastIcon,
};

/**
 * Header component for the application
 * Displays the logo, navigation links, and social media icons
 */
export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        {/* Main navigation */}
        <nav className="flex items-center gap-4">
          {/* Logo */}
          <Link className="flex items-center gap-2 border-b-2 border-transparent" href="/">
            <img src="/hotkys-logo-300x166.png" alt="Hotkys" className="h-12"/>
          </Link>
          
          {/* Navigation links */}
          {MAIN_NAV_LINKS.map((link) => {
            const Icon = NAV_ICONS[link.icon];
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                className={isActive
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-primary"
                }
                href={link.href}
              >
                <Icon className="h-5 w-5 md:hidden" aria-hidden="true" />
                <span className="hidden md:inline text-lg font-semibold">{link.label}</span>
                <span className="sr-only md:hidden">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Social media links and theme toggle */}
        <div className="flex items-center space-x-4">
          {SOCIAL_LINKS.map(link => (
            <Link
              key={link.href}
              className="text-foreground hover:underline"
              href={link.href}
              aria-label={link.label}
            >
              {link.icon === "TwitterIcon" ? (
                <TwitterIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <GithubIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
