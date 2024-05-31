"use client";

import React, {useState} from "react";
import {AppShortcuts} from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";
import {KeyboardBadge} from "@/components/ui/keyboard-badge";
import {InputProps} from "@/components/ui/input";
import {SearchBar} from "@/components/ui/search-bar";
import {LinkableListItem} from "@/components/ui/list";
import {cn} from "@/lib/utils";
import {Header1, HeaderCompact1} from "@/components/ui/typography";


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
            <HeaderCompact1 className="mt-0 mb-1">All Applications</HeaderCompact1>
            <SearchBar onChange={onChange}/>
            <div className="mt-2">
                {appShortcuts.map((app) => (
                    <LinkableListItem key={app.slug} to={`/apps/${app.slug}`}>
                        <span>{app.name}</span>
                        {app.bundleId && <KeyboardBadge tokens={[app.bundleId]}/>}
                    </LinkableListItem>
                ))}
            </div>
        </>
    );
};
