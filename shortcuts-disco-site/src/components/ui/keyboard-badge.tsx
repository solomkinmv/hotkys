type KeyboardBadgeProps = {
  modifiers?: string;
  base?: string;
  className?: string;
};

export const KeyboardBadge = ({ modifiers, base, ...props }: KeyboardBadgeProps) => (
    <span {...props}>
    {base && <kbd
        className="pointer-events-none h-5 select-none items-center gap-1 rounded font-mono font-medium opacity-100 bg-muted px-1.5">
      {modifiers && <span className="text-xs">{modifiers}</span>}
      {base}
    </kbd>}
  </span>
);
