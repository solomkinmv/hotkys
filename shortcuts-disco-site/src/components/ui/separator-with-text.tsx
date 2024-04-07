import React from "react";

const SeparatorWithText = React.forwardRef(({children}: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
    return (
        <div ref={ref} className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-px my-8 bg-gray-200 border-0 dark:bg-gray-700"/>
            <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">
                {children}
            </span>
        </div>
    )
});

SeparatorWithText.displayName = 'SeparatorWithText';

export { SeparatorWithText };
