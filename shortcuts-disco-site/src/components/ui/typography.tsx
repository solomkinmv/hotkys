import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Paragraph({children}: {children: React.ReactNode}) {
  return (
    <p className="leading-7 not-first:mt-6">
      {children}
    </p>
  )
}

export function Header1({children, className}: {children: string, className?: string}) {
  return (
      <h1 className={`text-4xl font-extrabold tracking-tight lg:text-5xl ${className}`}>
        {children}
      </h1>
  )
}

export function HeaderCompact1({children, className}: {children: string, className?: string}) {
  return (
      <h1 className={`font-extrabold tracking-tight ${className}`}>
        {children}
      </h1>
  )
}

interface TypographyLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function TypographyLink({ href, children, className }: TypographyLinkProps) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const isHash = href.startsWith('#');

  const linkClassName = cn("text-primary hover:underline", className);

  if (isHash) {
    return (
      <a href={href} className={linkClassName}>
        {children}
      </a>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName}>
      {children}
    </Link>
  );
}
