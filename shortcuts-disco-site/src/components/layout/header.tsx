import React from 'react';
import Link from 'next/link';
import { GithubIcon, TwitterIcon } from "@/components/ui/icons";
import { MAIN_NAV_LINKS, SOCIAL_LINKS } from "@/lib/constants/navigation";

/**
 * Header component for the application
 * Displays the logo, navigation links, and social media icons
 */
export const Header = () => {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between py-3">
        {/* Main navigation */}
        <nav className="flex items-center gap-4">
          {/* Logo */}
          <Link className="flex items-center gap-2 border-b-2 border-transparent" href="/">
            <img src="/hotkys-logo-300x166.png" alt="Hotkys" className="h-12"/>
          </Link>
          
          {/* Navigation links */}
          {MAIN_NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              className={index === 0
                ? "flex items-center gap-2 border-b-2 border-transparent hover:border-blue-500"
                : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-blue-500"
              }
              href={link.href}
            >
              {index === 0 ? <span className="text-lg font-semibold">{link.label}</span> : link.label}
            </Link>
          ))}
        </nav>
        
        {/* Social media links */}
        <div className="flex items-center space-x-4">
          {SOCIAL_LINKS.map(link => (
            <Link
              key={link.href}
              className="text-foreground hover:underline"
              href={link.href}
            >
              {link.icon === "TwitterIcon" ? (
                <TwitterIcon className="h-5 w-5" />
              ) : (
                <GithubIcon className="h-5 w-5" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};
