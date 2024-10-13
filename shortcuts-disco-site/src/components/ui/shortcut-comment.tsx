import React from "react";

type ShortcutCommentProps = {
  comment: string | undefined;
  className?: string;
};

export const ShortcutComment = ({
  comment,
  ...props
}: ShortcutCommentProps) => {
  if (!comment) {
    return null;
  }
  const tokens = generateCommentTokens(comment);
  console.log(tokens);
  return (
    tokens.length > 0 && (
      <span {...props}>
        {tokens.map((token, index) =>
          isSpecialSymbol(token) ? (
            <span
              key={index}
              className={
                "text-slate-500 font-sm text-sm bg-slate-100 px-1.5 py-1 rounded-md"
              }
            >
              {symbolOverride.get(token)}
            </span>
          ) : (
            <span
              key={index}
              className={
                "text-slate-500 font-sm text-sm bg-slate-100 px-1.5 py-1 rounded-md"
              }
            >
              {token}
            </span>
          ),
        )}
      </span>
    )
  );
};

function generateCommentTokens(optionalComment: string): string[] {
  let comment = optionalComment;
  const tokens: string[] = [comment];

  symbolOverride.forEach((symbol, text) => {
    const regex = new RegExp(`\\b${text}\\b`, "g");
    let newTokens: string[] = [];

    tokens.forEach((token) => {
      let parts = token.split(regex);
      while (parts.length > 1) {
        newTokens.push(parts.shift()!, symbol);
        token = parts.join(text);
        parts = token.split(regex);
      }
      newTokens.push(token);
    });

    tokens.length = 0;
    tokens.push(...newTokens);
  });

  console.log(tokens);
  return tokens;
}

function isSpecialSymbol(token: string) {
  return symbolOverride.has(token);
}

const symbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
  ["pageup", "PgUp"],
  ["pagedown", "PgDown"],
  ["home", "Home"],
  ["end", "End"],
  ["space", "Space"],
  ["capslock", "⇪"],
  ["backspace", "⌫"],
  ["tab", "⇥"],
  ["esc", "⎋"],
  ["enter", "↩"],
  ["cmd", "⌘"],
  ["ctrl", "⌃"],
  ["opt", "⌥"],
  ["shift", "⇧"],
]);
