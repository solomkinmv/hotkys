import {
  Action,
  ActionPanel,
  closeMainWindow,
  getFrontmostApplication,
  getPreferenceValues,
  List,
  PopToRootType,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useRef, useState } from "react";
import { Modifers, modifierSymbols } from "./model/modifiers";
import { AppHotkeys, Keymap, Section, SectionHotkey } from "./model/models";
import { runShortcuts } from "./engine/shortcut-runner";
import { shortcutsStorage } from "./shortcuts-storage/shortcuts-aggregator";

interface Preferences {
  delay: string;
}

async function executeShortcut(bundleId: string, key: string, modifiers: Modifers[] = []) {
  const delay: number = parseFloat(getPreferenceValues<Preferences>().delay); // todo: move work with preferences to separate structure
  closeMainWindow({ popToRootType: PopToRootType.Immediate });
  runShortcuts(bundleId, delay, key, modifiers);
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

  const [appHotkeys, setAppHotkeys] = useState<AppHotkeys | undefined>();
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
        const foundApp = shortcutsStorage.applications.find((app) => app.bundleId === bundleId);
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
            {section.hotkeys.map((hotkey) => {
              return (
                <List.Item
                  key={hotkey.title}
                  title={hotkey.title}
                  subtitle={generateHotkeyText(hotkey)}
                  actions={
                    <ActionPanel>
                      <Action
                        title="Apply"
                        onAction={() => executeShortcut(appHotkeys!.bundleId, hotkey.key, hotkey.modifiers)}
                      />
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

function generateHotkeyText(hotkey: SectionHotkey): string {
  const modifiersText = hotkey.modifiers?.map((modifier) => modifierSymbols.get(modifier)).join("") ?? "";
  return modifiersText + hotkey.key;
}
