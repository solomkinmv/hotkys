import { Section, SectionShortcut } from "@/app/lib/model/internal/internal-models";
import { Divider } from "@/app/ui/divider";
import { modifierMapping, modifierSymbols } from "@/app/lib/model/internal/modifiers";
import { clsx } from "clsx";

export default function ShortcutList(
  {
    sections,
  }: {
    sections: Section[]
  }) {

  return (
    <div>
      {sections.map((section, index) => (
        <div key={section.title}>
          <Divider>
            {section.title}
          </Divider>
          <SectionShortcut hotkeys={section.hotkeys} />
        </div>
      ))}
    </div>
  );
}

const SectionShortcut = ({ hotkeys }: { hotkeys: SectionShortcut[] }) => (
  <div className="flex flex-col">
    {hotkeys.map((hotkey, index) => (
      <div key={index}
           className={clsx(
             "p-2 border-gray-200 flex justify-between items-center",
             {
               "border-b": index < hotkeys.length - 1,
             }
           )}>
        <div>{hotkey.title}</div>
        {hotkey.sequence.length > 0 ?
          <ShortcutKbd shortcut={hotkey} /> :
          <ShortcutComment shortcut={hotkey} />
        }
      </div>
    ))}
  </div>
);

const ShortcutKbd = ({ shortcut }: { shortcut: SectionShortcut }) => (
  <kbd
    className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
    {generateHotkeyText(shortcut)}
  </kbd>
);

const ShortcutComment = ({ shortcut }: { shortcut: SectionShortcut }) => {
  const comment = generateCommentText(shortcut.comment);
  if (comment === undefined) {
    return null;
  }
  return (
    <div className="text-sm text-gray-500">{comment}</div>
  );
};


function generateHotkeyText(shortcut: SectionShortcut): string {
  return shortcut.sequence
    .map((atomicShortcut) => {
      const modifiersText = atomicShortcut.modifiers.map((modifier) => modifierSymbols.get(modifier)).join("") ?? "";
      return modifiersText + overrideSymbolIfPossible(atomicShortcut.base);
    })
    .join(" ");
}

function generateCommentText(optionalComment: string | undefined): string | undefined {
  if (optionalComment === undefined) {
    return undefined;
  }
  let comment = optionalComment;
  modifierMapping.forEach((modifier, text) => {
    comment = comment.replace("{" + text + "}", modifierSymbols.get(modifier) ?? "");
  });
  baseKeySymbolOverride.forEach((text, symbol) => {
    comment = comment.replace("{" + text + "}", symbol);
  });
  return comment;
}

function overrideSymbolIfPossible(base: string) {
  if (baseKeySymbolOverride.has(base)) {
    return baseKeySymbolOverride.get(base);
  }
  return base.toUpperCase();
}

const baseKeySymbolOverride: Map<string, string> = new Map([
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
