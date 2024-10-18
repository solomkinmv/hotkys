import Link from "next/link";
import React from "react";

export const LinkableListItem = ({children, to, selected}: { children: React.ReactNode; to: string, selected: boolean }) => (
    <Link href={to}
          passHref
          className="no-underline">
        <ListItem selected={selected}>
            {children}
        </ListItem>
    </Link>
);

export const ListItem = ({children, selected}: { children: React.ReactNode, selected: boolean }) => (
    <div className={`block flex cursor-pointer items-center justify-between border-b p-3 prose-sm last:border-0 hover:bg-slate-100/50 ${selected ? 'outline outline-2 outline-blue-500' : ''}`}>
        {children}
    </div>
);
