import React from "react";

export const Divider = ({ children }: { children: React.ReactNode }) => (
    <div className="relative flex py-5 items-center">
      <div className="flex-none border-t border-gray-300 w-4"></div>
      <span className="flex-shrink mx-4 text-gray-700">{children}</span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>
  )
;
