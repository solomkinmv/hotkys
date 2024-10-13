type KeyboardBadgeProps = {
    tokens: string[];
    className?: string;
};

export const KeyboardBadge = ({ tokens, ...props }: KeyboardBadgeProps) => (
    <span {...props}>
        {tokens
            .filter(token => token.trim() !== '')
            .map((token, index, arr) => [
                index > 0 && <span key={`plus-${index}`} className="px-1 text-neutral-300">+</span>,
                <kbd 
                    key={`kbd-${index}`}
                    className={`pointer-events-none h-5 select-none items-center gap-1 rounded font-mono font-medium opacity-100 bg-muted px-1.5 ${isSpecialSymbol(token) ? '' : 'pr-1.5'}`}
                >
                    {token}
                </kbd>
            ])
            .flat()
            .filter(Boolean)}
    </span>
);

function isSpecialSymbol(token: string) {
    if (token.length > 1) return false;
    if (token === " ") return false;
    return !/^[a-z0-9]+$/i.test(token);
}
