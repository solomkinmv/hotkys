import { runPowerShellScript } from "@raycast/utils";

const powerShellScript = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

function Get-BrowserUrl {
  try {
    $automation = [System.Windows.Automation.AutomationElement]
    $rootElement = $automation::RootElement

    # Get the foreground window
    $focusedElement = $automation::FocusedElement
    if ($null -eq $focusedElement) {
      return $null
    }

    # Try to find the browser address bar
    # Chrome and Edge use "Address and search bar"
    $chromeEdgeCondition = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::NameProperty,
      "Address and search bar"
    )
    $addressBar = $focusedElement.FindFirst(
      [System.Windows.Automation.TreeScope]::Descendants,
      $chromeEdgeCondition
    )

    if ($null -ne $addressBar) {
      $valuePattern = $addressBar.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
      if ($null -ne $valuePattern) {
        return $valuePattern.Current.Value
      }
    }

    # Firefox uses a different approach - try finding by AutomationId "urlbar"
    $firefoxCondition = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
      "urlbar"
    )
    $firefoxBar = $focusedElement.FindFirst(
      [System.Windows.Automation.TreeScope]::Descendants,
      $firefoxCondition
    )

    if ($null -ne $firefoxBar) {
      $valuePattern = $firefoxBar.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
      if ($null -ne $valuePattern) {
        return $valuePattern.Current.Value
      }
    }

    return $null
  } catch {
    return $null
  }
}

Get-BrowserUrl
`.trim();

function extractHostname(url: string): string {
  const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im);
  return match ? match[1] : url;
}

export async function getWindowsFrontmostHostname(): Promise<string | null> {
  try {
    const url = await runPowerShellScript(powerShellScript);
    return url && url !== "null" && url.trim() !== "" ? extractHostname(url.trim()) : null;
  } catch (error) {
    console.error("Failed to get Windows frontmost hostname:", error);
    return null;
  }
}
