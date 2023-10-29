import { Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import { aggregatedApps } from "../shortcuts-db/shortcuts-aggregator";
import { validate } from "./validator";

export default useShortcutsProvider;

let shortcutsProvider: ShortcutsProvider;

function useShortcutsProvider() {
  if (shortcutsProvider == null) {
    shortcutsProvider = new ShortcutsProvider();
  }
  return shortcutsProvider;
}

class ShortcutsProvider {
  public getShortcuts(): Shortcuts {
    validate(aggregatedApps);
    return {
      applications: parseInputShortcuts(aggregatedApps),
    };
  }
}
