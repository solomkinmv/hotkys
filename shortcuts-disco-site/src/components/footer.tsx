import React from 'react';
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="flex items-center justify-between p-6 border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Maksym Solomkin</p>
            <nav className="flex gap-4">
                <Link className="text-xs hover:underline underline-offset-4" href="https://github.com/solomkinmv">
                    GitHub
                </Link>
                <Link className="text-xs hover:underline underline-offset-4" href="https://twitter.com/solomkinmv">
                    Twitter
                </Link>
            </nav>
        </footer>
    );
};
