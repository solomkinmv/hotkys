import keyCodesData from "../../../public/data/key-codes.json";
import type {
  InputApp,
  InputKeymap,
  InputSection,
  InputShortcut,
} from "@/lib/model/input/input-models";
import type {
  CustomApp,
  CustomShortcut,
} from "@/lib/model/user/user-models";
import Validator from "@/lib/load/validator";
import { normalizeShortcutKey } from "@/lib/shortcut-key-format";
import { validateCustomAppMetadata } from "@/lib/validation/user-content";

type CustomShortcutDraft = Pick<CustomShortcut, "title" | "key" | "comment">;

const validator = new Validator(
  new Map((keyCodesData as { keyCodes: [string, string][] }).keyCodes)
);

export function validateCustomShortcutDraft(draft: CustomShortcutDraft): void {
  const normalizedDraft = normalizeCustomShortcutDraft(draft);
  validator.validate([
    {
      name: "Custom shortcut",
      slug: "custom-shortcut",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "General",
              shortcuts: [toInputShortcut(normalizedDraft)],
            },
          ],
        },
      ],
    },
  ]);
}

export function normalizeCustomShortcutDraft<T extends CustomShortcutDraft>(
  draft: T
): T {
  return {
    ...draft,
    key: draft.key ? normalizeShortcutKey(draft.key) : draft.key,
  };
}

export function validateCustomApp(customApp: CustomApp): void {
  validateCustomAppMetadata(customApp);
  validator.validate([convertCustomAppToInputApp(customApp)]);
}

export function convertCustomAppToInputApp(customApp: CustomApp): InputApp {
  const keymaps: InputKeymap[] = [...customApp.keymaps]
    .map((keymap) => {
      const sections: InputSection[] = [...keymap.sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => ({
          title: section.title,
          shortcuts: [...section.shortcuts]
            .filter((shortcut) => !shortcut.isDeleted)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(toInputShortcut),
        }));

      const inputKeymap: InputKeymap = {
        title: keymap.title,
        sections,
      };

      if (keymap.platforms && keymap.platforms.length > 0) {
        inputKeymap.platforms = keymap.platforms;
      }

      return inputKeymap;
    });

  const inputApp: InputApp = {
    $schema: "schema/shortcut.schema.json",
    name: customApp.name,
    slug: customApp.slug,
    keymaps,
  };

  if (customApp.bundleId) {
    inputApp.bundleId = customApp.bundleId;
  }
  if (customApp.hostname) {
    inputApp.hostname = customApp.hostname;
  }
  if (customApp.source) {
    inputApp.source = customApp.source;
  }
  if (customApp.icon) {
    inputApp.icon = customApp.icon;
  }

  return inputApp;
}

function toInputShortcut(shortcut: CustomShortcutDraft): InputShortcut {
  const inputShortcut: InputShortcut = {
    title: shortcut.title,
  };

  if (shortcut.key) {
    inputShortcut.key = normalizeShortcutKey(shortcut.key);
  }
  if (shortcut.comment) {
    inputShortcut.comment = shortcut.comment;
  }

  return inputShortcut;
}
