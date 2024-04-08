import React from "react";

const SeparatorWithText = React.forwardRef(({children}: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
    return (
        <div ref={ref} className="inline-flex w-full items-center justify-center">
            <hr className="my-8 h-px w-full border-0 bg-gray-200 dark:bg-gray-700"/>
            <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white">
                {children}
            </span>
        </div>
    )
});

SeparatorWithText.displayName = 'SeparatorWithText';

export { SeparatorWithText };
