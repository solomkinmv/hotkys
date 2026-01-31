import { spawn } from "child_process";
import { AtomicShortcut } from "../model/internal/internal-models";
import { KeyCodes } from "../load/key-codes-provider";
import { getPlatform } from "../load/platform";
import { runWindowsShortcuts } from "./windows-shortcut-runner";

interface Chord {
  keyCode: number;
  modifiers: string[];
}

function buildJxaScript(bundleId: string, delaySeconds: number, chords: Chord[]): string {
  // Validate bundleId format to prevent injection
  if (bundleId && !/^[a-zA-Z0-9.-]+$/.test(bundleId)) {
    throw new Error(`Invalid bundle ID format: ${bundleId}`);
  }

  const bundleIdLiteral = JSON.stringify(bundleId);
  const chordsLiteral = JSON.stringify(chords);

  // language=JavaScript
  return `(function() {
    const app = Application.currentApplication();
    app.includeStandardAdditions = true;
    const systemEvents = Application("System Events");
    const bundleId = ${bundleIdLiteral};
    if (bundleId && systemEvents.applicationProcesses.whose({ bundleIdentifier: bundleId }).length > 0) {
      app.doShellScript("open -b " + bundleId);
      delay(${delaySeconds});
    }
    ${chordsLiteral}.forEach(function(chord) {
      systemEvents.keyCode(chord.keyCode, { using: chord.modifiers });
    });
  })();`;
}

export async function runShortcuts(
  bundleId: string | undefined,
  delaySeconds: number,
  sequence: AtomicShortcut[],
  keyCodes: KeyCodes | undefined,
  windowsAppId?: string | undefined
): Promise<void> {
  const platform = getPlatform();

  if (platform === "windows") {
    await runWindowsShortcuts(windowsAppId, delaySeconds, sequence);
    return;
  }

  // On macOS, keyCodes is required
  if (!keyCodes) {
    throw new Error("Key codes are required for macOS shortcut execution");
  }

  const chords: Chord[] = sequence.map((atomic) => {
    const keyCodeStr = keyCodes[atomic.base];
    if (keyCodeStr === undefined) {
      throw new Error(`Unknown key: ${atomic.base}`);
    }
    const keyCode = parseInt(keyCodeStr, 10);
    if (isNaN(keyCode)) {
      throw new Error(`Invalid key code for ${atomic.base}: ${keyCodeStr}`);
    }
    return { keyCode, modifiers: atomic.modifiers };
  });

  const script = buildJxaScript(bundleId ?? "", delaySeconds, chords);

  const child = spawn("osascript", ["-l", "JavaScript", "-e", script], {
    detached: true,
    stdio: "ignore",
  });

  child.on("error", (error) => {
    console.error("Failed to spawn osascript:", error);
  });

  child.unref();
}
