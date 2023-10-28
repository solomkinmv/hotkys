import { Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import { aggregatedApps } from "../shortcuts-db/shortcuts-aggregator";
import { useCachedState } from "@raycast/utils";

export default useShortcutsProvider;

let shortcutsProvider: ShortcutsProvider;

function useShortcutsProvider() {
  // if (shortcutsProvider == null) {
    shortcutsProvider = new ShortcutsProvider();
  // }
  return shortcutsProvider;
}

class ShortcutsProvider {
  private shortcuts: Shortcuts;
  private setShortcuts: (shortcuts: Shortcuts) => void;

  constructor() {
    [this.shortcuts, this.setShortcuts] = useCachedState("shortcuts", this.getShortcuts());
  }

  public getCachedShortcuts(): Shortcuts {
    return this.shortcuts;
  }

  public getShortcuts(): Shortcuts {
    return {
      applications: parseInputShortcuts(aggregatedApps),
    };
  }
}
