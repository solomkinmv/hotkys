import { Action, ActionPanel, closeMainWindow, getPreferenceValues, Icon, List, PopToRootType } from "@raycast/api";
import { useState } from "react";
import { runShortcuts } from "../engine/shortcut-runner";
import useKeyCodes from "../load/key-codes-provider";
import type { Application, Keymap, SectionShortcut } from "../model/internal/internal-models";
import type { FavoriteIdentifier } from "../user-data/favorites";
import type { Favorite } from "../user-data/models";
import { FavoriteAction } from "./favorite-action";
import { generateHotkeyAccessories } from "./hotkey-text-formatter";
import { KeymapDropdown } from "./keymap-dropdown";

interface ShortcutsListProps {
  application: Application | undefined;
  favorites?: Favorite[];
  initialKeymapTitle?: string;
  initialSearchText?: string;
  isLoading?: boolean;
  onToggleFavorite?: (identifier: FavoriteIdentifier) => Promise<void>;
}

interface Preferences {
  delay: string;
}

export function ShortcutsList({
  application,
  favorites = [],
  initialKeymapTitle,
  initialSearchText,
  isLoading,
  onToggleFavorite,
}: ShortcutsListProps) {
  const keyCodesResponse = useKeyCodes();
  const keymaps = application?.keymaps ?? [];
  const [selectedKeymapTitle, setSelectedKeymapTitle] = useState(initialKeymapTitle);
  const [searchText, setSearchText] = useState(initialSearchText ?? "");
  const selectedKeymap = selectKeymap(keymaps, selectedKeymapTitle) ?? keymaps[0];

  const handleShortcutExecution = async (currentApplication: Application, shortcut: SectionShortcut) => {
    if (keyCodesResponse.data === undefined) return;
    const delay = parseFloat(getPreferenceValues<Preferences>().delay);
    await closeMainWindow({ popToRootType: PopToRootType.Immediate });
    await runShortcuts(currentApplication.bundleId, delay, shortcut.sequence, keyCodesResponse.data);
  };

  return (
    <List
      isLoading={isLoading}
      filtering
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search for shortcuts"
      searchBarAccessory={
        <KeymapDropdown
          keymaps={keymaps.map((keymap) => keymap.title)}
          value={selectedKeymap?.title}
          initialValue={initialKeymapTitle}
          onKeymapChange={setSelectedKeymapTitle}
        />
      }
      navigationTitle={application?.name}
    >
      {application && selectedKeymap
        ? selectedKeymap.sections.map((section) => (
            <List.Section key={section.title} title={section.title}>
              {section.hotkeys.map((shortcut) => {
                const hotkeyAccessories = generateHotkeyAccessories(shortcut);
                const commentAccessory: List.Item.Accessory[] = shortcut.comment
                  ? [{ text: shortcut.comment, icon: Icon.SpeechBubble }]
                  : [];
                const identifier: FavoriteIdentifier = {
                  itemType: "shortcut",
                  appSlug: application.slug,
                  customAppId: application.customAppId,
                  keymapTitle: selectedKeymap.title,
                  sectionTitle: shortcut.baseSectionTitle ?? section.title,
                  shortcutTitle: shortcut.baseShortcutTitle ?? shortcut.title,
                  baseShortcutId: shortcut.baseShortcutId,
                };

                return (
                  <List.Item
                    key={generateShortcutKey(shortcut)}
                    title={shortcut.title}
                    accessories={[...hotkeyAccessories, ...commentAccessory]}
                    keywords={[section.title]}
                    actions={
                      <ActionPanel>
                        {shortcut.sequence.length > 0 ? (
                          <Action title="Apply" onAction={() => handleShortcutExecution(application, shortcut)} />
                        ) : null}
                        {onToggleFavorite ? (
                          <FavoriteAction identifier={identifier} favorites={favorites} onToggle={onToggleFavorite} />
                        ) : null}
                      </ActionPanel>
                    }
                  />
                );
              })}
            </List.Section>
          ))
        : null}
    </List>
  );
}

function selectKeymap(keymaps: Keymap[], keymapName: string | undefined): Keymap | undefined {
  return keymaps.find((keymap) => keymap.title === keymapName);
}

function generateShortcutKey({ title, sequence }: SectionShortcut): string {
  return `${title}-${sequence.map(({ modifiers, base }) => `${modifiers.join("")}${base}`).join("")}`;
}
