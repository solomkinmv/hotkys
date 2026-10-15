import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react";
import type {
  Platform,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import { Modifiers } from "@/lib/model/internal/modifiers";

const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const originalUserAgent = navigator.userAgent;

const shiftCommandA: SectionShortcut = {
  title: "Select all",
  sequence: [{ base: "a", modifiers: [Modifiers.shift, Modifiers.command] }],
};

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

async function renderUnderUserAgent(
  userAgent: string,
  shortcut: SectionShortcut,
  platforms?: Platform[],
) {
  setUserAgent(userAgent);
  let container: HTMLElement | undefined;
  await jest.isolateModulesAsync(async () => {
    const { ShortcutDisplay } = await import("./shortcut-display");
    container = render(
      <ShortcutDisplay shortcut={shortcut} platforms={platforms} />,
    ).container;
  });
  if (!container) throw new Error("ShortcutDisplay did not render");
  return container;
}

function visibleKeys(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("[data-slot=kbd]")).map(
    (key) => key.textContent ?? "",
  );
}

describe("ShortcutDisplay", () => {
  afterEach(() => setUserAgent(originalUserAgent));

  it("renders macOS glyphs for a macOS keymap on a Windows visitor", async () => {
    const container = await renderUnderUserAgent(WINDOWS_UA, shiftCommandA, [
      "macos",
    ]);

    expect(visibleKeys(container)).toEqual(["⇧", "⌘", "A"]);
  });

  it("renders Windows words for a Windows keymap on a macOS visitor", async () => {
    const container = await renderUnderUserAgent(
      MAC_UA,
      {
        title: "Save",
        sequence: [
          { base: "s", modifiers: [Modifiers.control, Modifiers.option] },
        ],
      },
      ["windows"],
    );

    expect(visibleKeys(container)).toEqual(["Ctrl", "Alt", "S"]);
    expect(container.textContent).not.toContain("⌃");
  });

  it("uses macOS glyphs when a keymap lists macOS among several platforms", async () => {
    const container = await renderUnderUserAgent(WINDOWS_UA, shiftCommandA, [
      "windows",
      "macos",
    ]);

    expect(visibleKeys(container)).toEqual(["⇧", "⌘", "A"]);
  });

  it("uses Super for the Windows key on a Linux keymap", async () => {
    const container = await renderUnderUserAgent(
      MAC_UA,
      {
        title: "Launcher",
        sequence: [{ base: "space", modifiers: [Modifiers.win] }],
      },
      ["linux"],
    );

    expect(visibleKeys(container)).toEqual(["Super", "Space"]);
  });

  it("hides glyphs from assistive technology and speaks key names", async () => {
    const container = await renderUnderUserAgent(
      WINDOWS_UA,
      {
        title: "Jump",
        sequence: [
          { base: "a", modifiers: [Modifiers.shift, Modifiers.command] },
          { base: "left", modifiers: [Modifiers.option] },
        ],
      },
      ["macos"],
    );

    const groups = container.querySelectorAll("[data-slot=kbd-group]");
    expect(groups).toHaveLength(2);
    groups.forEach((group) =>
      expect(group.getAttribute("aria-hidden")).toBe("true"),
    );
    expect(
      Array.from(container.querySelectorAll(".sr-only")).map(
        (label) => label.textContent,
      ),
    ).toEqual(["Shift Command A", "Option Left Arrow"]);
  });
});
