import React from 'react';
import Link from 'next/link';
import {GithubIcon, TwitterIcon} from "@/components/ui/icons";

export const Header = () => {
    return (
        <header className="border-b">
            <div className="mx-auto flex max-w-3xl items-center justify-between py-6">
                <nav className="flex gap-4">
                    <Link className="flex items-center gap-2" href="/">
                        <span className="text-lg font-semibold">Shortcuts Disco</span>
                    </Link>
                    <Link className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                          href="/about">
                        About
                    </Link>
                    <Link className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                          href="/raycast-extension">
                        Raycast Extension
                    </Link>
                </nav>
                <div className="flex items-center space-x-4">
                    <Link className="text-gray-900 hover:underline dark:text-gray-100"
                          href="https://twitter.com/solomkinmv">
                        <TwitterIcon className="h-5 w-5"/>
                    </Link>
                    <Link className="text-gray-900 hover:underline dark:text-gray-100"
                          href="https://github.com/solomkinmv/shortcuts-disco">
                        <GithubIcon className="h-5 w-5"/>
                    </Link>
                </div>
            </div>
        </header>
    );
};
