"use client";

import React, {useState} from "react";
import {AppShortcuts} from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";
import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";
import {KeyboardBadge} from "@/components/ui/keyboard-badge";
import Link from "next/link";
import {InputProps} from "@/components/ui/input";
import {SearchBar} from "@/components/ui/search-bar";


export const ApplicationList = (
    {
        applications,
    }: {
        applications: AppShortcuts[];
    }) => {

    const [appShortcuts, setAppShortcuts] = useState(applications);


    const fuse = new Fuse(applications, {
        keys: ["name"],
        includeScore: true,
        includeMatches: true
    });
    const onChange: InputProps["onChange"] = (e) => {
        const inputText = e.currentTarget.value;
        if (!inputText) {
            setAppShortcuts(applications);
        } else {
            setAppShortcuts(fuse.search(e.currentTarget.value).map(result => result.item));
        }
    };

    return (
        <>
            <SearchBar onChange={onChange}/>
            <Table>
                <TableBody>
                    {appShortcuts.map((app) => (
                        <TableRow key={app.slug}>
                            <TableCell className="font-medium"><Link
                                href={`/apps/${app.slug}/default`}>{app.name}</Link></TableCell>
                            <TableCell className="text-right"><KeyboardBadge base={app.bundleId}/></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};
