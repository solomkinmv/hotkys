import { Action, ActionPanel, closeMainWindow, getPreferenceValues, Icon, List, PopToRootType } from "@raycast/api";
import { KeymapDropdown } from "./keymap-dropdown";
import { generateHotkeyText } from "./hotkey-text-formatter";
import { Application, Section, SectionShortcut } from "../model/internal/internal-models";
import { runShortcuts } from "../engine/shortcut-runner";
import useKeyCodes from "../load/key-codes-provider";

interface ShortcutsListProps {
  isLoading: boolean;
  application: Application | undefined;
  keymaps: string[];
  onKeymapChange: (newValue: string) => void;
  keymapSections: Section[];
}

interface Preferences {
  delay: string;
}

export function ShortcutsList({ isLoading, application, keymaps, onKeymapChange, keymapSections }: ShortcutsListProps) {
  const keyCodesResponse = useKeyCodes();

  const handleShortcutExecution = async (application: Application, sectionShortcut: SectionShortcut) => {
    if (keyCodesResponse.data === undefined) return;
    const delay: number = parseFloat(getPreferenceValues<Preferences>().delay);
    await closeMainWindow({ popToRootType: PopToRootType.Immediate });
    await runShortcuts(application.bundleId, delay, sectionShortcut.sequence, keyCodesResponse.data);
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search for shortcuts"
      searchBarAccessory={<KeymapDropdown keymaps={keymaps} onKeymapChange={onKeymapChange} />}
      navigationTitle={application?.name}
    >
      {application &&
        keymapSections.map((section) => {
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
                          <Action title="Apply" onAction={() => handleShortcutExecution(application, shortcut)} />
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
