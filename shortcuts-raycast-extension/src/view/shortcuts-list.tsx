import {
  Action,
  ActionPanel,
  closeMainWindow,
  getPreferenceValues,
  Icon,
  List,
  PopToRootType,
  showToast,
  Toast,
} from "@raycast/api";
import { KeymapDropdown } from "./keymap-dropdown";
import { generateHotkeyAccessories } from "./hotkey-text-formatter";
import { Application, Keymap, Section, SectionShortcut } from "../model/internal/internal-models";
import { runShortcuts } from "../engine/shortcut-runner";
import useKeyCodes from "../load/key-codes-provider";
import { useEffect, useState } from "react";

interface ShortcutsListProps {
  application: Application | undefined;
  isLoading?: boolean;
}

interface Preferences {
  delay: string;
}

export function ShortcutsList({ application, isLoading: externalLoading }: ShortcutsListProps) {
  const keyCodesResponse = useKeyCodes();
  const keymaps = application?.keymaps.map((k) => k.title) ?? [];
  const [keymapSections, setKeymapSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!application) return;
    setKeymapSections(application?.keymaps?.[0]?.sections ?? []);
    setIsLoading(false);
  }, [application]);

  const loading = externalLoading ?? isLoading;

  const handleShortcutExecution = async (application: Application, sectionShortcut: SectionShortcut) => {
    if (keyCodesResponse.data === undefined) return;
    const delayStr = getPreferenceValues<Preferences>().delay;
    const delay = parseFloat(delayStr);
    if (!Number.isFinite(delay) || delay < 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid delay value",
        message: `Please enter a valid positive number for delay (got: "${delayStr}")`,
      });
      return;
    }
    await closeMainWindow({ popToRootType: PopToRootType.Immediate });
    try {
      await runShortcuts(
        application.bundleId,
        delay,
        sectionShortcut.sequence,
        keyCodesResponse.data,
        application.windowsAppId
      );
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to execute shortcut",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleKeymapChange = (newValue: string) => {
    setKeymapSections(selectKeymap(application?.keymaps ?? [], newValue)?.sections ?? []);
  };

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search for shortcuts"
      searchBarAccessory={<KeymapDropdown keymaps={keymaps} onKeymapChange={handleKeymapChange} />}
      navigationTitle={application?.name}
    >
      {application &&
        keymapSections.map((section) => {
          return (
            <List.Section key={section.title} title={section.title}>
              {section.hotkeys.map((shortcut) => {
                // It is possible the same title is repeated, with two alternative key sequences.
                // Therefore, to generate a unique key, we have to combine info about the title and key sequences.
                const generateKey = ({ title, sequence }: SectionShortcut) =>
                  `${title}-${[sequence.map(({ modifiers, base }) => `${modifiers.join("")}${base}`)].flat().join("")}`;
                const hotkeyAccessories = generateHotkeyAccessories(shortcut);
                const commentAccessory: List.Item.Accessory[] = shortcut.comment
                  ? [{ text: shortcut.comment, icon: Icon.SpeechBubble }]
                  : [];
                return (
                  <List.Item
                    key={generateKey(shortcut)}
                    title={shortcut.title}
                    accessories={[...hotkeyAccessories, ...commentAccessory]}
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

function selectKeymap(keymaps: Keymap[], keymapName: string): Keymap | undefined {
  return keymaps.find((keymap) => keymap.title === keymapName);
}
