import Link from "next/link";
import React from "react";

export const LinkableListItem = ({children, to}: { children: React.ReactNode; to: string }) => (
    <Link href={to}
          passHref
          className="no-underline">
        <ListItem>
            {children}
        </ListItem>
    </Link>
);

export const ListItem = ({children}: { children: React.ReactNode }) => (
    <div className="block flex cursor-pointer items-center justify-between border-b p-3 prose-sm last:border-0 hover:bg-slate-100/50">
        {children}
    </div>
);
