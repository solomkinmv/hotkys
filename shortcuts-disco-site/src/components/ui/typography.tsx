import React from "react";

export function Paragraph({children}: {children: React.ReactNode}) {
  return (
    <p className="leading-7 [&:not(:first-child)]:mt-6">
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
