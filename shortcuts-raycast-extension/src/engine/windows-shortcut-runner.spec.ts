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
      expect(script).toContain("FromBase64String");

      // Verify the base64-encoded JSON contains the expected key
      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "a" }]);
      }
    });

    it("generates script with Ctrl modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "s", modifiers: [Modifiers.control] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "^(s)" }]);
      }
    });

    it("generates script with multiple modifiers", () => {
      const sequence: AtomicShortcut[] = [{ base: "s", modifiers: [Modifiers.control, Modifiers.shift] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "^+(s)" }]);
      }
    });

    it("generates script with Alt modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "f4", modifiers: [Modifiers.option] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "%{F4}" }]);
      }
    });

    it("generates script for special keys - Enter", () => {
      const sequence: AtomicShortcut[] = [{ base: "enter", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "{ENTER}" }]);
      }
    });

    it("generates script for special keys - Tab", () => {
      const sequence: AtomicShortcut[] = [{ base: "tab", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "{TAB}" }]);
      }
    });

    it("generates script for special keys - Escape", () => {
      const sequence: AtomicShortcut[] = [{ base: "escape", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "{ESC}" }]);
      }
    });

    it("generates script for arrow keys", () => {
      const testArrowKey = (base: string, expected: string) => {
        const sequence: AtomicShortcut[] = [{ base, modifiers: [] }];
        const script = buildPowerShellScript(undefined, 100, sequence);
        const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
        expect(base64Match).toBeTruthy();
        if (base64Match) {
          const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
          const chords = JSON.parse(decoded);
          expect(chords).toEqual([{ keysString: expected }]);
        }
      };

      testArrowKey("left", "{LEFT}");
      testArrowKey("right", "{RIGHT}");
      testArrowKey("up", "{UP}");
      testArrowKey("down", "{DOWN}");
    });

    it("generates script for function keys", () => {
      const testFunctionKey = (base: string, expected: string) => {
        const sequence: AtomicShortcut[] = [{ base, modifiers: [] }];
        const script = buildPowerShellScript(undefined, 100, sequence);
        const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
        expect(base64Match).toBeTruthy();
        if (base64Match) {
          const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
          const chords = JSON.parse(decoded);
          expect(chords).toEqual([{ keysString: expected }]);
        }
      };

      testFunctionKey("f1", "{F1}");
      testFunctionKey("f12", "{F12}");
    });

    it("generates script for Home and End keys", () => {
      const testKey = (base: string, expected: string) => {
        const sequence: AtomicShortcut[] = [{ base, modifiers: [] }];
        const script = buildPowerShellScript(undefined, 100, sequence);
        const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
        expect(base64Match).toBeTruthy();
        if (base64Match) {
          const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
          const chords = JSON.parse(decoded);
          expect(chords).toEqual([{ keysString: expected }]);
        }
      };

      testKey("home", "{HOME}");
      testKey("end", "{END}");
    });

    it("generates script for Page Up and Page Down keys", () => {
      const testKey = (base: string, expected: string) => {
        const sequence: AtomicShortcut[] = [{ base, modifiers: [] }];
        const script = buildPowerShellScript(undefined, 100, sequence);
        const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
        expect(base64Match).toBeTruthy();
        if (base64Match) {
          const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
          const chords = JSON.parse(decoded);
          expect(chords).toEqual([{ keysString: expected }]);
        }
      };

      testKey("pageup", "{PGUP}");
      testKey("pagedown", "{PGDN}");
    });

    it("generates script for Delete and Backspace keys", () => {
      const testKey = (base: string, expected: string) => {
        const sequence: AtomicShortcut[] = [{ base, modifiers: [] }];
        const script = buildPowerShellScript(undefined, 100, sequence);
        const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
        expect(base64Match).toBeTruthy();
        if (base64Match) {
          const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
          const chords = JSON.parse(decoded);
          expect(chords).toEqual([{ keysString: expected }]);
        }
      };

      testKey("delete", "{DELETE}");
      testKey("backspace", "{BACKSPACE}");
    });

    it("generates script for Space key", () => {
      const sequence: AtomicShortcut[] = [{ base: "space", modifiers: [] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: " " }]);
      }
    });

    it("generates script for chord sequence", () => {
      const sequence: AtomicShortcut[] = [
        { base: "k", modifiers: [Modifiers.control] },
        { base: "s", modifiers: [Modifiers.control] },
      ];
      const script = buildPowerShellScript("code", 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "^(k)" }, { keysString: "^(s)" }]);
      }
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

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "^(c)" }]);
      }
    });

    it("handles mixed command and control modifiers", () => {
      const sequence: AtomicShortcut[] = [
        { base: "c", modifiers: [Modifiers.command] },
        { base: "v", modifiers: [Modifiers.control] },
      ];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "^(c)" }, { keysString: "^(v)" }]);
      }
    });

    it("handles special key with modifier", () => {
      const sequence: AtomicShortcut[] = [{ base: "f5", modifiers: [Modifiers.shift] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "+{F5}" }]);
      }
    });

    it("handles Ctrl+Shift+Esc (Task Manager shortcut)", () => {
      const sequence: AtomicShortcut[] = [{ base: "escape", modifiers: [Modifiers.control, Modifiers.shift] }];
      const script = buildPowerShellScript(undefined, 100, sequence);

      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const chords = JSON.parse(decoded);
        expect(chords).toEqual([{ keysString: "^+{ESC}" }]);
      }
    });

    it("generates valid JSON for chords array", () => {
      const sequence: AtomicShortcut[] = [
        { base: "k", modifiers: [Modifiers.control] },
        { base: "s", modifiers: [Modifiers.control] },
      ];
      const script = buildPowerShellScript("code", 100, sequence);

      // Extract the base64-encoded JSON and verify it's valid
      const base64Match = script.match(/FromBase64String\('([^']+)'\)/);
      expect(base64Match).toBeTruthy();
      if (base64Match) {
        const decoded = Buffer.from(base64Match[1], "base64").toString("utf8");
        const parsedChords = JSON.parse(decoded);
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

    it("throws error for invalid windowsAppId - consecutive dots", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript("app..exe", 100, sequence)).toThrow("Invalid Windows app ID format");
    });

    it("throws error for invalid windowsAppId - starts with dot", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript(".notepad", 100, sequence)).toThrow("Invalid Windows app ID format");
    });

    it("throws error for invalid windowsAppId - ends with dot", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript("notepad.", 100, sequence)).toThrow("Invalid Windows app ID format");
    });

    it("throws error for invalid windowsAppId - contains space", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      expect(() => buildPowerShellScript("note pad", 100, sequence)).toThrow("Invalid Windows app ID format");
    });

    it("uses base64 encoding for chords JSON to prevent injection", () => {
      const sequence: AtomicShortcut[] = [{ base: "a", modifiers: [] }];
      const script = buildPowerShellScript("notepad", 100, sequence);

      // Should use base64 encoding instead of directly embedding JSON
      expect(script).toContain("FromBase64String");
      expect(script).toContain("UTF8.GetString");
      expect(script).not.toContain("$chords = '");
    });
  });
});
