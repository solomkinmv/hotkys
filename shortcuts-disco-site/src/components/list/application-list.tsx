"use client";

import React, {useState} from "react";
import {AppShortcuts} from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";
import {KeyboardBadge} from "@/components/ui/keyboard-badge";
import {InputProps} from "@/components/ui/input";
import {SearchBar} from "@/components/ui/search-bar";
import {LinkableListItem} from "@/components/ui/list";


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
            <div className="mt-2">
                {appShortcuts.map((app) => (
                    <LinkableListItem key={app.slug} to={`/apps/${app.slug}`}>
                        <span>{app.name}</span>
                        <KeyboardBadge base={app.bundleId}/>
                    </LinkableListItem>
                ))}
            </div>
        </>
    );
};
