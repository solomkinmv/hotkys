import React from 'react';
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="flex items-center justify-between border-t p-6">
            <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="m-0">
                    Made by <Link href="https://solomk.in" className="underline">Maksym Solomkin</Link></p>
                <p className="m-0">
                    <Link href="https://github.com/solomkinmv/shortcuts-disco/issues"
                          className="underline">
                        Report issues or make a request
                    </Link>
                </p>
            </div>
            <nav className="flex gap-4">
                <Link className="text-xs underline-offset-4 hover:underline"
                      href="https://github.com/solomkinmv/shortcuts-disco">
                    GitHub
                </Link>
                <Link className="text-xs underline-offset-4 hover:underline" href="https://twitter.com/solomkinmv">
                    Twitter
                </Link>
            </nav>
        </footer>
    );
};
