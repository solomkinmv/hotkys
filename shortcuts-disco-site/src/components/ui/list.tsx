import clsx from "clsx";
import Link from "next/link";
import React, { forwardRef } from "react";

export const LinkableListItem = forwardRef<
  HTMLAnchorElement,
  {
    children: React.ReactNode;
    to: string;
    selected: boolean;
  }
>(({ children, to, selected }, ref) => (
  <Link href={to} passHref className="no-underline" ref={ref}>
    <ListItem selected={selected}>{children}</ListItem>
  </Link>
));

LinkableListItem.displayName = "LinkableListItem";

export const ListItem = ({
  children,
  selected,
}: {
  children: React.ReactNode;
  selected: boolean;
}) => (
  <div
    className={clsx(
      "flex cursor-pointer items-center justify-between border-b p-2 prose-sm last:border-0 hover:bg-slate-100/50",
      { "outline outline-2 outline-offset-1 rounded-md": selected },
    )}
  >
    {children}
  </div>
);
