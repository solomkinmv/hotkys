import React from 'react';
import Image from "next/image";
import Link from 'next/link';
import {GithubIcon, MoonIcon, TwitterIcon} from "@/components/ui/icons";

export const Header = () => {
    return (
        <header className="flex items-center justify-between p-6 border-b">
            <Link className="flex items-center gap-2" href="/">
                {/*<MountainIcon className="h-6 w-6"/>*/}
                {/*<Image src="/logo-192.png" alt="Icon" className="h-6 w-6" width={192} height={192} />*/}
                <span className="text-lg font-semibold">Shortcuts Disco</span>
            </Link>
            <nav className="flex gap-4">
                <Link className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50" href="/about">
                    About
                </Link>
                <Link className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50" href="/raycast-extension">
                    Raycast Extension
                </Link>
            </nav>
            <div className="flex items-center space-x-4">
                <Link className="text-gray-900 dark:text-gray-100 hover:underline" href="https://twitter.com/solomkinmv">
                    <TwitterIcon className="h-5 w-5"/>
                </Link>
                <Link className="text-gray-900 dark:text-gray-100 hover:underline" href="https://github.com/solomkinmv">
                    <GithubIcon className="h-5 w-5"/>
                </Link>
                {/*<Toggle aria-label="Toggle dark mode" variant="outline">*/}
                {/*    <MoonIcon className="h-5 w-5"/>*/}
                {/*</Toggle>*/}
            </div>
        </header>
    );
};
