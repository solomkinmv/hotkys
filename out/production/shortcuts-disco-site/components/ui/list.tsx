import Link from "next/link";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const LinkableListItem = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    to: string;
    selected: boolean;
  }
>(({ children, to, selected }, ref) => (
  <Link href={to} passHref className="no-underline">
    <ListItem selected={selected} ref={ref}>
      {children}
    </ListItem>
  </Link>
));

LinkableListItem.displayName = "LinkableListItem";

export const ListItem = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    selected: boolean;
  }
>(({ children, selected }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center justify-between border-b p-2 prose-sm last:border-0 hover:bg-accent",
      { "outline-solid outline-2 outline-offset-1 rounded-md": selected },
    )}
  >
    {children}
  </div>
));

ListItem.displayName = "ListItem";
