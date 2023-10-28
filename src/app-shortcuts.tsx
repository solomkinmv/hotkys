import {
  Action,
  ActionPanel,
  closeMainWindow,
  getFrontmostApplication,
  getPreferenceValues,
  List,
  PopToRootType,
} from "@raycast/api";
import { useCachedState, usePromise } from "@raycast/utils";
import { useRef, useState } from "react";
import { runShortcuts } from "./engine/shortcut-runner";
import { AppShortcuts, AtomicShortcut, Keymap, Section, SectionShortcut } from "./model/internal/internal-models";
import useShortcutsProvider from "./load/shortcuts-provider";
import { modifierSymbols } from "./model/internal/modifiers";

interface Preferences {
  delay: string;
}

async function executeShortcut(bundleId: string, shortcutSequence: AtomicShortcut[]) {
  const delay: number = parseFloat(getPreferenceValues<Preferences>().delay); // todo: move work with preferences to separate structure
  closeMainWindow({ popToRootType: PopToRootType.Immediate });
  runShortcuts(bundleId, delay, shortcutSequence[0].base, shortcutSequence[0].modifiers);
}

function KeymapDropdown(props: { keymaps: string[]; onKeymapChange: (newValue: string) => void }) {
  const { keymaps, onKeymapChange } = props;
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
  const bundleIdOverride: string | undefined = props?.bundleId;

  const shortcutsProvider = useShortcutsProvider();
  const [shortcuts] = useCachedState("shortcuts", shortcutsProvider.getShortcuts());
  const [appHotkeys, setAppHotkeys] = useState<AppShortcuts | undefined>();
  const [keymaps, setKeymaps] = useState<string[]>([]);
  const [keymapSections, setKeymapSections] = useState<Section[]>([]);

  const abortable = useRef<AbortController>();
  const { isLoading } = usePromise(
    async () => {
      return bundleIdOverride ?? (await getFrontmostApplication()).bundleId;
    },
    [],
    {
      onData: (bundleId) => {
        const foundApp = shortcuts.applications.find((app) => app.bundleId === bundleId);
        const foundKeymaps = foundApp?.keymaps.map((k) => k.title) ?? [];
        const foundSections = foundApp?.keymaps[0].sections ?? [];
        setAppHotkeys(foundApp);
        setKeymaps(foundKeymaps);
        setKeymapSections(foundSections);
      },
      abortable: abortable,
    }
  );

  const onKeymapChange = (newValue: string) => {
    setKeymapSections(selectKeymap(appHotkeys?.keymaps ?? [], newValue)?.sections ?? []);
  };
  return (
    <List
      isLoading={isLoading}
      navigationTitle="Search Beers"
      searchBarPlaceholder="Search for hotkeys"
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
                      <Action title="Apply" onAction={() => executeShortcut(appHotkeys!.bundleId, shortcut.sequence)} />
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
]);
