import React from 'react';
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="flex items-center justify-between border-t p-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Maksym Solomkin</p>
            <nav className="flex gap-4">
                <Link className="text-xs underline-offset-4 hover:underline" href="https://github.com/solomkinmv/shortcuts-disco">
                    GitHub
                </Link>
                <Link className="text-xs underline-offset-4 hover:underline" href="https://twitter.com/solomkinmv">
                    Twitter
                </Link>
            </nav>
        </footer>
    );
};
