import React from 'react';
import Link from 'next/link';
import {GithubIcon, TwitterIcon} from "@/components/ui/icons";

export const Header = () => {
    return (
        <header className="border-b">
            <div className="mx-auto flex max-w-3xl items-center justify-between py-3">
                <nav className="flex items-center gap-4">
                    <Link className="flex items-center gap-2 border-b-2 border-transparent" href="/">
                        <img src="/hotkys-logo-300x166.png" alt="Hotkys" className="h-12"/>
                    </Link>
                    <Link className="flex items-center gap-2 border-b-2 border-transparent hover:border-blue-500"
                          href="/">
                        <span className="text-lg font-semibold">Home</span>
                    </Link>
                    <Link
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:border-b-2 hover:border-blue-500"
                        href="/about">
                        About
                    </Link>
                    <Link
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:border-b-2 hover:border-blue-500"
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
