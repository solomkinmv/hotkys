import { runPowerShellScript } from "@raycast/utils";
import { AtomicShortcut } from "../model/internal/internal-models";
import { Modifiers, windowsSendKeysModifiers } from "../model/internal/modifiers";

interface SendKeysChord {
  keysString: string;
}

function mapBaseKeyToSendKeys(base: string): string {
  const specialKeys: Record<string, string> = {
    enter: "{ENTER}",
    tab: "{TAB}",
    escape: "{ESC}",
    esc: "{ESC}",
    backspace: "{BACKSPACE}",
    delete: "{DELETE}",
    del: "{DELETE}",
    home: "{HOME}",
    end: "{END}",
    pageup: "{PGUP}",
    pagedown: "{PGDN}",
    pgup: "{PGUP}",
    pgdn: "{PGDN}",
    left: "{LEFT}",
    right: "{RIGHT}",
    up: "{UP}",
    down: "{DOWN}",
    space: " ",
    f1: "{F1}",
    f2: "{F2}",
    f3: "{F3}",
    f4: "{F4}",
    f5: "{F5}",
    f6: "{F6}",
    f7: "{F7}",
    f8: "{F8}",
    f9: "{F9}",
    f10: "{F10}",
    f11: "{F11}",
    f12: "{F12}",
    f13: "{F13}",
    f14: "{F14}",
    f15: "{F15}",
    f16: "{F16}",
  };

  const lowerBase = base.toLowerCase();
  if (specialKeys[lowerBase]) {
    return specialKeys[lowerBase];
  }

  // Single character keys stay as-is
  if (base.length === 1) {
    return base;
  }

  // Unknown keys - return as-is and let SendKeys handle it
  return base;
}

function buildSendKeysString(atomic: AtomicShortcut): string {
  let result = "";

  // Add modifiers
  for (const modifier of atomic.modifiers) {
    const sendKeysModifier = windowsSendKeysModifiers.get(modifier as Modifiers);
    if (!sendKeysModifier) {
      if (modifier === Modifiers.win) {
        throw new Error("Shortcuts with Windows key modifier are not supported by the automation framework");
      }
      throw new Error(`Unsupported modifier for Windows: ${modifier}`);
    }
    result += sendKeysModifier;
  }

  // Add base key
  const baseKey = mapBaseKeyToSendKeys(atomic.base);

  // If base key is a special key (wrapped in {}), or if there are modifiers,
  // we might need to wrap it differently for SendKeys
  if (baseKey.startsWith("{") && baseKey.endsWith("}")) {
    // Special key - keep the braces
    result += baseKey;
  } else if (atomic.modifiers.length > 0) {
    // If there are modifiers, wrap single character in parentheses
    result += `(${baseKey})`;
  } else {
    // No modifiers, just the key
    result += baseKey;
  }

  return result;
}

export function buildPowerShellScript(
  windowsAppId: string | undefined,
  delayMilliseconds: number,
  sequence: AtomicShortcut[]
): string {
  // Validate delay
  if (!Number.isFinite(delayMilliseconds) || delayMilliseconds < 0) {
    throw new Error(`Invalid delay value: ${delayMilliseconds}`);
  }

  // Validate sequence
  if (sequence.length === 0) {
    throw new Error("Shortcut sequence cannot be empty");
  }

  // Validate windowsAppId format to prevent injection
  if (windowsAppId && !/^[a-zA-Z0-9._-]+(?:\.exe)?$/.test(windowsAppId)) {
    throw new Error(`Invalid Windows app ID format: ${windowsAppId}`);
  }

  const chords: SendKeysChord[] = sequence.map((atomic) => ({
    keysString: buildSendKeysString(atomic),
  }));

  const chordsJson = JSON.stringify(chords);
  const appIdLiteral = windowsAppId ? JSON.stringify(windowsAppId) : '""';

  // Strip .exe extension for ProcessName matching
  return `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

$appId = ${appIdLiteral}
if ($appId -ne "") {
  $appIdWithoutExt = $appId -replace '\\.exe$', ''
  $proc = Get-Process | Where-Object { $_.MainWindowTitle -and $_.ProcessName -eq $appIdWithoutExt } | Select-Object -First 1
  if ($proc) {
    [Microsoft.VisualBasic.Interaction]::AppActivate($proc.Id)
    Start-Sleep -Milliseconds ${delayMilliseconds}
  } else {
    throw "Could not find process with name: $appIdWithoutExt"
  }
}

$chords = ${chordsJson} | ConvertFrom-Json
foreach ($chord in $chords) {
  [System.Windows.Forms.SendKeys]::SendWait($chord.keysString)
}
`.trim();
}

export async function runWindowsShortcuts(
  windowsAppId: string | undefined,
  delaySeconds: number,
  sequence: AtomicShortcut[]
): Promise<void> {
  const delayMilliseconds = Math.round(delaySeconds * 1000);
  const script = buildPowerShellScript(windowsAppId, delayMilliseconds, sequence);

  await runPowerShellScript(script);
}
