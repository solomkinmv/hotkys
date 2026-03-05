import { useFetch } from "@raycast/utils";
import { getPlatform } from "./platform";
import { useMemo } from "react";

export type KeyCodes = Record<string, string>;

interface IncomingKeyCodes {
  keyCodes: [string, string][];
}

interface UseKeyCodesResult {
  isLoading: boolean;
  data: KeyCodes | undefined;
  revalidate: () => void;
}

// Windows key names for validation only (not numeric codes like macOS)
// These are the key names that can appear in shortcut data files
function getWindowsKeyNames(): KeyCodes {
  const keys: KeyCodes = {};

  // Letters
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i); // a-z
    keys[letter] = letter;
  }

  // Numbers
  for (let i = 0; i <= 9; i++) {
    keys[i.toString()] = i.toString();
  }

  // Function keys
  for (let i = 1; i <= 16; i++) {
    keys[`f${i}`] = `f${i}`;
  }

  // Special keys
  const specialKeys = [
    "enter",
    "tab",
    "escape",
    "esc",
    "backspace",
    "delete",
    "del",
    "home",
    "end",
    "pageup",
    "pagedown",
    "pgup",
    "pgdn",
    "left",
    "right",
    "up",
    "down",
    "space",
    "insert",
    "pause",
    "scrolllock",
    "numlock",
    "capslock",
    "printscreen",
    "break",
  ];

  specialKeys.forEach((key) => {
    keys[key] = key;
  });

  // Symbols and punctuation
  const symbols = [
    "`",
    "-",
    "=",
    "[",
    "]",
    "\\",
    ";",
    "'",
    ",",
    ".",
    "/",
    "~",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "_",
    "+",
    "{",
    "}",
    "|",
    ":",
    '"',
    "<",
    ">",
    "?",
  ];

  symbols.forEach((symbol) => {
    keys[symbol] = symbol;
  });

  return keys;
}

export default function useKeyCodes(): UseKeyCodesResult {
  const platform = getPlatform();

  const { isLoading, data, revalidate } = useFetch<IncomingKeyCodes, undefined, KeyCodes>(
    "https://hotkys.com/data/key-codes.json",
    {
      execute: platform === "macos", // Only fetch on macOS
      mapResult: (result) => ({
        data: Object.fromEntries(result.keyCodes),
      }),
      failureToastOptions: {
        title: "Failed to load key codes",
      },
    }
  );

  // On Windows, provide static key names immediately
  const windowsData = useMemo(() => {
    if (platform === "windows") {
      return getWindowsKeyNames();
    }
    return undefined;
  }, [platform]);

  return {
    isLoading: platform === "windows" ? false : isLoading,
    data: platform === "windows" ? windowsData : data,
    revalidate,
  };
}
