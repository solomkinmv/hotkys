import { Action, ActionPanel, closeMainWindow, getFrontmostApplication, getPreferenceValues, List, PopToRootType } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import { runShortcuts } from "./engine/shortcut-runner";
import { AppShortcuts, AtomicShortcut, Keymap, Section, SectionShortcut, Shortcuts } from "./model/internal/internal-models";
import { modifierSymbols } from "./model/internal/modifiers";
import useShortcutsProvider from './load/shortcuts-provider';

interface Preferences {
  delay: string;
}

async function executeShortcut(bundleId: string, shortcutSequence: AtomicShortcut[]) {
  const delay: number = parseFloat(getPreferenceValues<Preferences>().delay); // todo: move work with preferences to separate structure
  await closeMainWindow({ popToRootType: PopToRootType.Immediate });
  await runShortcuts(bundleId, delay, shortcutSequence);
}

function KeymapDropdown(props: { keymaps: string[]; onKeymapChange: (newValue: string) => void }) {
  const { keymaps, onKeymapChange } = props;
  if (keymaps.length == 1) {
    return null;
  }
  return (
    <List.Dropdown
      tooltip="Select Keymap"
      storeValue={true}
      onChange={(newValue) => {
        onKeymapChange(newValue);
      }}
    >
      <List.Dropdown.Section title="Keymaps">
        {keymaps.map((keymap) => (
          <List.Dropdown.Item key={keymap} title={keymap} value={keymap} />
        ))}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}

export default function AppShortcuts(props: { bundleId: string } | undefined) {
  const [bundleId, setBundleId] = useState(props?.bundleId);
  const [appShortcuts, setAppShortcuts] = useState<AppShortcuts | undefined>();
  const [keymaps, setKeymaps] = useState<string[]>([]);
  const [keymapSections, setKeymapSections] = useState<Section[]>([]);

  const initAppShortcuts = (bundleId: string, shortcuts: Shortcuts) => {
    const foundApp = shortcuts.applications.find((app) => app.bundleId === bundleId);
    const foundKeymaps = foundApp?.keymaps.map((k) => k.title) ?? [];
    const foundSections = foundApp?.keymaps[0].sections ?? [];
    setAppShortcuts(foundApp);
    setKeymaps(foundKeymaps);
    setKeymapSections(foundSections);
  };

  const {isLoading, shortcuts} = useShortcutsProvider((shortcuts) => {
    if (!bundleId) return;
    initAppShortcuts(bundleId, shortcuts);
  });

  const bundleLoading = usePromise(
      async () => {
        return bundleId ?? (await getFrontmostApplication()).bundleId;
      },
      [],
      {
        onData: (bundleId) => {
          if (!bundleId) return;
          setBundleId(bundleId);
          initAppShortcuts(bundleId, shortcuts);
        },
      },
  ).isLoading;

  const onKeymapChange = (newValue: string) => {
    setKeymapSections(selectKeymap(appShortcuts?.keymaps ?? [], newValue)?.sections ?? []);
  };
  return (
    <List
      isLoading={isLoading || bundleLoading}
      navigationTitle="Current App Shortcuts"
      searchBarPlaceholder="Search for shortcuts"
      searchBarAccessory={<KeymapDropdown keymaps={keymaps} onKeymapChange={onKeymapChange} />}
    >
      {keymapSections.map((section) => {
        return (
          <List.Section key={section.title} title={section.title}>
            {section.hotkeys.map((shortcut) => {
              return (
                <List.Item
                  key={shortcut.title}
                  title={shortcut.title}
                  subtitle={generateHotkeyText(shortcut)}
                  actions={
                    <ActionPanel>
                      <Action title="Apply" onAction={() => appShortcuts && executeShortcut(appShortcuts.bundleId, shortcut.sequence)}/>
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        );
      })}
    </List>
  );
}

function selectKeymap(keymaps: Keymap[], keymapName: string): Keymap | undefined {
  return keymaps.find((keymap) => keymap.title === keymapName);
}

function generateHotkeyText(shortcut: SectionShortcut): string {
  return shortcut.sequence
    .map((atomicShortcut) => {
      const modifiersText = atomicShortcut.modifiers.map((modifier) => modifierSymbols.get(modifier)).join("") ?? "";
      return modifiersText + overrideSymbolIfPossible(atomicShortcut.base);
    })
    .join(" ");
}

function overrideSymbolIfPossible(base: string) {
  if (baseKeySymbolOverride.has(base)) {
    return baseKeySymbolOverride.get(base);
  }
  return base.toUpperCase();
}

const baseKeySymbolOverride: Map<string, string> = new Map([
  ["left", "←"],
  ["right", "→"],
  ["up", "↑"],
  ["down", "↓"],
  ["pageup", "PgUp"],
  ["pagedown", "PgDown"],
  ["home", "Home"],
  ["end", "End"],
  ["tab", "⇥"],
  ["esc", "⎋"],
]);
