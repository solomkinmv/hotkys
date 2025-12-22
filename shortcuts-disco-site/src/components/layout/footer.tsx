import React from 'react';
import Link from "next/link";
import { FOOTER_LINKS, SOCIAL_LINKS } from "@/lib/constants/navigation";
import { TypographyXs } from "@/components/ui/typography";

/**
 * Footer component for the application
 * Displays copyright information, links to report issues, and social media links
 */
export const Footer = () => {
  return (
    <footer className="flex items-center justify-between border-t p-6">
      {/* Copyright and issue reporting */}
      <div className="space-y-0">
        <TypographyXs>
          Made by <Link href="https://solomk.in" className="underline">Maksym Solomkin</Link>
        </TypographyXs>

        {/* Footer links */}
        {FOOTER_LINKS.map(link => (
          <TypographyXs key={link.href} className="block">
            <Link href={link.href} className="underline">
              {link.label}
            </Link>
          </TypographyXs>
        ))}
      </div>

      {/* Social media links */}
      <nav className="flex gap-4">
        {SOCIAL_LINKS.map(link => (
          <Link
            key={link.href}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
};
