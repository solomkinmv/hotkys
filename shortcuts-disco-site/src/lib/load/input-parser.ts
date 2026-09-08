import { parseKey } from "@/lib/shortcut-core/parser";
import {AppShortcuts, SectionShortcut} from "@/lib/model/internal/internal-models";
import {modifierMapping} from "@/lib/model/internal/modifiers";
import {InputApp, InputShortcut} from "@/lib/model/input/input-models";

export class ShortcutsParser {

    public parseInputShortcuts(inputApps: InputApp[]): AppShortcuts[] {
        return inputApps.map((inputApp) => {
            return {
                name: inputApp.name,
                bundleId: inputApp.bundleId,
                hostname: inputApp.hostname,
                slug: inputApp.slug,
                source: inputApp.source,
                icon: inputApp.icon,
                keymaps: inputApp.keymaps.map((inputKeymap) => {
                    return {
                        title: inputKeymap.title,
                        platforms: inputKeymap.platforms,
                        sections: inputKeymap.sections.map((inputSection) => {
                            return {
                                title: inputSection.title,
                                hotkeys: inputSection.shortcuts.map((inputShortcut) => this.parseSingleShortcut(inputShortcut)),
                            };
                        }),
                    };
                }),
            };
        });
    }

  private parseSingleShortcut(inputShortcut: InputShortcut): SectionShortcut {
    return { title: inputShortcut.title, comment: inputShortcut.comment,
      sequence: parseKey(inputShortcut.key).map(({base, modifiers}) => ({base, modifiers: modifiers.map(token => modifierMapping.get(token)!)})) };
  }
}
