import React from 'react';
import Link from "next/link";
import { FOOTER_LINKS, SOCIAL_LINKS } from "@/lib/constants/navigation";

/**
 * Footer component for the application
 * Displays copyright information, links to report issues, and social media links
 */
export const Footer = () => {
  return (
    <footer className="flex items-center justify-between border-t p-6">
      {/* Copyright and issue reporting */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p className="m-0">
          Made by <Link href="https://solomk.in" className="underline">Maksym Solomkin</Link>
        </p>
        
        {/* Footer links */}
        {FOOTER_LINKS.map(link => (
          <p key={link.href} className="m-0">
            <Link href={link.href} className="underline">
              {link.label}
            </Link>
          </p>
        ))}
      </div>
      
      {/* Social media links */}
      <nav className="flex gap-4">
        {SOCIAL_LINKS.map(link => (
          <Link 
            key={link.href}
            className="text-xs underline-offset-4 hover:underline"
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
};
