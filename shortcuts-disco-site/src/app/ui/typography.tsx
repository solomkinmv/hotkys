import React from "react";


export const InlineCode = (
  {
    code,
  }: {
    code: string;
  }) => (
  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
    {code}
  </code>
);
