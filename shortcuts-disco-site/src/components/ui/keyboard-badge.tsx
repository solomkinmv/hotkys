type KeyboardBadgeProps = {
    tokens: string[];
    className?: string;
};

export const KeyboardBadge = ({tokens, ...props}: KeyboardBadgeProps) => (
    <span {...props}>
        <kbd
            className="pointer-events-none h-5 select-none items-center gap-1 rounded font-mono font-medium opacity-100 bg-muted px-1.5">
            {tokens.map((token, index) => {
                if (isSpecialSymbol(token)) {
                    return <span key={index} className="pr-0.5">{token}</span>;
                }
                return <span key={index} className="font-extralight">{token}</span>;
            })}
        </kbd>
    </span>
);

function isSpecialSymbol(token: string) {
    if (token.length > 1) return false;
    if (token === " ") return false;
    return !/^[a-z0-9]+$/i.test(token);
}
