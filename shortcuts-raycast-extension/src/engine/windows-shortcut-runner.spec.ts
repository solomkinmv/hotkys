// Mock @raycast/utils before importing the module under test
jest.mock("@raycast/utils", () => ({
  runPowerShellScript: jest.fn(),
}));

import { buildPowerShellScript } from "./windows-shortcut-runner";
import { AtomicShortcut } from "../model/internal/internal-models";
import { Modifiers } from "../model/internal/modifiers";

describe("Windows Shortcut Runner", () => {
  describe("buildPowerShellScript", () => {
    it("generates script for single key without modifiers", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      expect(script).toContain("Add-Type -AssemblyName System.Windows.Forms");
      expect(script).toContain("Add-Type -AssemblyName Microsoft.VisualBasic");
      expect(script).toContain('$appId = "notepad"');
      expect(script).toContain("Start-Sleep -Milliseconds 100");
      expect(script).toContain('"keysString":"a"');
    });

    it("generates script with Ctrl modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "s", modifiers: [Modifiers.control] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      expect(script).toContain('"keysString":"^(s)"');
    });

    it("generates script with multiple modifiers", () => {
      const sequence: AtomicShortcut[] = [{ base: "s", modifiers: [Modifiers.control, Modifiers.shift] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      expect(script).toContain('"keysString":"^+(s)"');
    });

    it("generates script with Alt modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "f4", modifiers: [Modifiers.option] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      expect(script).toContain('"keysString":"%{F4}"');
    });

    it("generates script for special keys - Enter", () => {
      const sequence: AtomicShortcut[] = [{ base: "enter", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"{ENTER}"');
    });

    it("generates script for special keys - Tab", () => {
      const sequence: AtomicShortcut[] = [{ base: "tab", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"{TAB}"');
    });

    it("generates script for special keys - Escape", () => {
      const sequence: AtomicShortcut[] = [{ base: "escape", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"{ESC}"');
    });

    it("generates script for arrow keys", () => {
      const leftSequence: AtomicShortcut[] = [{ base: "left", modifiers: [] }];
      const rightSequence: AtomicShortcut[] = [{ base: "right", modifiers: [] }];
      const upSequence: AtomicShortcut[] = [{ base: "up", modifiers: [] }];
      const downSequence: AtomicShortcut[] = [{ base: "down", modifiers: [] }];

      expect(buildPowerShellScript(undefined, 100, leftSequence)).toContain('"keysString":"{LEFT}"');
      expect(buildPowerShellScript(undefined, 100, rightSequence)).toContain('"keysString":"{RIGHT}"');
      expect(buildPowerShellScript(undefined, 100, upSequence)).toContain('"keysString":"{UP}"');
      expect(buildPowerShellScript(undefined, 100, downSequence)).toContain('"keysString":"{DOWN}"');
    });

    it("generates script for function keys", () => {
      const f1Sequence: AtomicShortcut[] = [{ base: "f1", modifiers: [] }];
      const f12Sequence: AtomicShortcut[] = [{ base: "f12", modifiers: [] }];

      expect(buildPowerShellScript(undefined, 100, f1Sequence)).toContain('"keysString":"{F1}"');
      expect(buildPowerShellScript(undefined, 100, f12Sequence)).toContain('"keysString":"{F12}"');
    });

    it("generates script for Home and End keys", () => {
      const homeSequence: AtomicShortcut[] = [{ base: "home", modifiers: [] }];
      const endSequence: AtomicShortcut[] = [{ base: "end", modifiers: [] }];

      expect(buildPowerShellScript(undefined, 100, homeSequence)).toContain('"keysString":"{HOME}"');
      expect(buildPowerShellScript(undefined, 100, endSequence)).toContain('"keysString":"{END}"');
    });

    it("generates script for Page Up and Page Down keys", () => {
      const pgupSequence: AtomicShortcut[] = [{ base: "pageup", modifiers: [] }];
      const pgdnSequence: AtomicShortcut[] = [{ base: "pagedown", modifiers: [] }];

      expect(buildPowerShellScript(undefined, 100, pgupSequence)).toContain('"keysString":"{PGUP}"');
      expect(buildPowerShellScript(undefined, 100, pgdnSequence)).toContain('"keysString":"{PGDN}"');
    });

    it("generates script for Delete and Backspace keys", () => {
      const deleteSequence: AtomicShortcut[] = [{ base: "delete", modifiers: [] }];
      const backspaceSequence: AtomicShortcut[] = [{ base: "backspace", modifiers: [] }];

      expect(buildPowerShellScript(undefined, 100, deleteSequence)).toContain('"keysString":"{DELETE}"');
      expect(buildPowerShellScript(undefined, 100, backspaceSequence)).toContain('"keysString":"{BACKSPACE}"');
    });

    it("generates script for Space key", () => {
      const sequence: AtomicShortcut[] = [{ base: "space", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":" "');
    });

    it("generates script for chord sequence", () => {
      const sequence: AtomicShortcut[] = [
        { base: "k", modifiers: [Modifiers.control] },
        { base: "s", modifiers: [Modifiers.control] },
      ];
      const script = buildPowerShellScript("code", 100, sequence);

      expect(script).toContain('"keysString":"^(k)"');
      expect(script).toContain('"keysString":"^(s)"');
    });

    it("skips app activation when windowsAppId is undefined", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('$appId = ""');
    });

    it("includes app activation when windowsAppId is provided", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      expect(script).toContain('$appId = "notepad"');
      expect(script).toContain("Get-Process");
      expect(script).toContain("AppActivate");
    });

    it("converts delay seconds to milliseconds", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("notepad", 250, sequence);

      expect(script).toContain("Start-Sleep -Milliseconds 250");
    });

    it("handles cmd modifier as Ctrl on Windows", () => {
      const sequence: AtomicShortcut[] = [{ base: "c", modifiers: [Modifiers.command] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"^(c)"');
    });

    it("handles mixed command and control modifiers", () => {
      const sequence: AtomicShortcut[] = [
        { base: "c", modifiers: [Modifiers.command] },
        { base: "v", modifiers: [Modifiers.control] },
      ];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"^(c)"');
      expect(script).toContain('"keysString":"^(v)"');
    });

    it("handles special key with modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "f5", modifiers: [Modifiers.shift] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"+{F5}"');
    });

    it("handles Ctrl+Shift+Esc (Task Manager shortcut)", () => {
      const sequence: AtomicShortcut[] = [{ base: "escape", modifiers: [Modifiers.control, Modifiers.shift] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      expect(script).toContain('"keysString":"^+{ESC}"');
    });

    it("generates valid JSON for chords array", () => {
      const sequence: AtomicShortcut[] = [
        { base: "k", modifiers: [Modifiers.control] },
        { base: "s", modifiers: [Modifiers.control] },
      ];
      const script = buildPowerShellScript("code", 100, sequence);

      // Extract the JSON portion and verify it's valid
      const jsonMatch = script.match(/\$chords = '(\[.*?\])' \| ConvertFrom-Json/s);
      expect(jsonMatch).toBeTruthy();
      if (jsonMatch) {
        const parsedChords = JSON.parse(jsonMatch[1]);
        expect(parsedChords).toHaveLength(2);
        expect(parsedChords[0]).toHaveProperty("keysString");
        expect(parsedChords[1]).toHaveProperty("keysString");
      }
    });

    it("strips .exe extension from windowsAppId for ProcessName matching", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("Code.exe", 100, sequence);

      expect(script).toContain("$appIdWithoutExt = $appId -replace '\\.exe$', ''");
      expect(script).toContain("$_.ProcessName -eq $appIdWithoutExt");
    });

    it("includes error message when app activation fails", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      expect(script).toContain("throw");
      expect(script).toContain("Could not find process with name");
    });

    it("throws error for invalid delay - NaN", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript("notepad", NaN, sequence)).toThrow("Invalid delay value");
    });

    it("throws error for invalid delay - negative", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript("notepad", -100, sequence)).toThrow("Invalid delay value");
    });

    it("throws error for invalid delay - Infinity", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript("notepad", Infinity, sequence)).toThrow("Invalid delay value");
    });

    it("allows zero delay", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("notepad", 0, sequence);
      expect(script).toContain("Start-Sleep -Milliseconds 0");
    });

    it("throws error for empty sequence", () => {
      expect(() => buildPowerShellScript("notepad", 100, [])).toThrow("Shortcut sequence cannot be empty");
    });

    it("throws error for unsupported Windows key modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "e", modifiers: [Modifiers.win] }];
      expect(() => buildPowerShellScript(undefined, 100, sequence)).toThrow(
        "Shortcuts with Windows key modifier are not supported"
      );
    });
  });
});
