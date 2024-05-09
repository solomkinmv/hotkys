type KeyboardBadgeProps = {
  modifiers?: string;
  base?: string;
  className?: string;
};

export const KeyboardBadge = ({ modifiers, base, ...props }: KeyboardBadgeProps) => (
    <span {...props}>
    {base && <span
        className="h-5">
      {/* {modifiers && <span className="text-xs">{modifiers}</span>} */}
      {/* {base} */}
      {base.split('').map((char, index) => (
          <kbd key={index} className=" shadow-slate-200 pointer-events-none text-xs h-5 select-none gap-4 mx-0.5 rounded font-mono font-semibold opacity-100 bg-muted px-1.5">{char}</kbd>
        ))}
    </span>}
  </span>
);
