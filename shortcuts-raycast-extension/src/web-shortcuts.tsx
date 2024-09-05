import { Action, ActionPanel, closeMainWindow, getPreferenceValues, Icon, List, PopToRootType } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { runShortcuts } from "./engine/shortcut-runner";
import { Application, AtomicShortcut, Keymap, Section } from "./model/internal/internal-models";
import useAllShortcuts from "./load/shortcuts-provider";
import useKeyCodes from "./load/key-codes-provider";
import { getFrontmostHostname } from "./hooks/use-frontmost-hostname";
import { generateHotkeyText } from "./view/hotkey-text-formatter";

interface Preferences {
  delay: string;
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

export default function WebShortcuts() {
  const [application, setApplication] = useState<Application>();
  const [hostname, setHostname] = useState<string>();
  const [keymaps, setKeymaps] = useState<string[]>([]);
  const [keymapSections, setKeymapSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const keyCodesResponse = useKeyCodes();
  const shortcutsProviderResponse = useAllShortcuts();

  useEffect(() => {
    if (application || shortcutsProviderResponse.isLoading || !hostname) {
      return;
    }
    const foundApp = shortcutsProviderResponse.data.applications.find((app) => app.hostname === hostname);
    if (!foundApp) {
      // noinspection JSIgnoredPromiseFromCall
      closeMainWindow({ clearRootSearch: true, popToRootType: PopToRootType.Immediate });
      // noinspection JSIgnoredPromiseFromCall
      showFailureToast(undefined, { title: `Shortcuts not available for web page ${hostname}` });
      return;
    }
    setApplication(foundApp);
  }, [shortcutsProviderResponse.isLoading, hostname, application]);

  useEffect(() => {
    if (!application) return;
    const foundKeymaps = application?.keymaps.map((k) => k.title) ?? [];
    const foundSections = application?.keymaps[0].sections ?? [];
    setKeymaps(foundKeymaps);
    setKeymapSections(foundSections);
    setIsLoading(false);
  }, [application]);

  usePromise(getFrontmostHostname, [], {
    onData: (fetchedHostname) => {
      if (!fetchedHostname) return;
      setHostname(fetchedHostname);
    },
  });

  const onKeymapChange = (newValue: string) => {
    setKeymapSections(selectKeymap(application?.keymaps ?? [], newValue)?.sections ?? []);
  };

  async function executeShortcut(bundleId: string | undefined, shortcutSequence: AtomicShortcut[]) {
    if (keyCodesResponse.data === undefined) return;
    const delay: number = parseFloat(getPreferenceValues<Preferences>().delay);
    await closeMainWindow({ popToRootType: PopToRootType.Immediate });
    await runShortcuts(bundleId, delay, shortcutSequence, keyCodesResponse.data);
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search for shortcuts"
      searchBarAccessory={<KeymapDropdown keymaps={keymaps} onKeymapChange={onKeymapChange} />}
      navigationTitle={application?.name}
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
                  accessories={
                    shortcut.comment
                      ? [
                          {
                            text: shortcut.comment,
                            icon: Icon.SpeechBubble,
                          },
                        ]
                      : undefined
                  }
                  keywords={[section.title]}
                  actions={
                    shortcut.sequence.length > 0 ? (
                      <ActionPanel>
                        <Action
                          title="Apply"
                          onAction={() => application && executeShortcut(undefined, shortcut.sequence)}
                        />
                      </ActionPanel>
                    ) : undefined
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
