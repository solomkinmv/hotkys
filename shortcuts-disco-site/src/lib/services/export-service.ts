import type { CustomApp } from "@/lib/model/user/user-models";
import type { InputApp, InputKeymap, InputSection, InputShortcut } from "@/lib/model/input/input-models";

export interface ExportResult {
  app: InputApp;
  json: string;
  prDescription: string;
}

export const exportService = {
  exportCustomApp(customApp: CustomApp): ExportResult {
    const inputApp = convertToInputApp(customApp);
    const json = JSON.stringify(inputApp, null, 2);
    const prDescription = generatePrDescription(inputApp);

    return {
      app: inputApp,
      json,
      prDescription,
    };
  },

  exportMultipleApps(customApps: CustomApp[]): ExportResult[] {
    return customApps.map((app) => this.exportCustomApp(app));
  },
};

function convertToInputApp(customApp: CustomApp): InputApp {
  const keymaps: InputKeymap[] = customApp.keymaps.map((keymap) => {
    const sections: InputSection[] = keymap.sections
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => ({
        title: section.title,
        shortcuts: section.shortcuts
          .filter((s) => !s.isDeleted)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((shortcut): InputShortcut => {
            const inputShortcut: InputShortcut = {
              title: shortcut.title,
            };
            if (shortcut.key) {
              inputShortcut.key = shortcut.key;
            }
            if (shortcut.comment) {
              inputShortcut.comment = shortcut.comment;
            }
            return inputShortcut;
          }),
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

function generatePrDescription(app: InputApp): string {
  const totalShortcuts = app.keymaps.reduce(
    (acc, km) => acc + km.sections.reduce((sAcc, s) => sAcc + s.shortcuts.length, 0),
    0
  );

  const platformsList = app.keymaps
    .flatMap((km) => km.platforms ?? [])
    .filter((p, i, arr) => arr.indexOf(p) === i);

  const platformsText =
    platformsList.length > 0 ? platformsList.join(", ") : "all platforms";

  return `## Add ${app.name} shortcuts

This PR adds keyboard shortcuts for **${app.name}**.

### Summary
- **App slug**: \`${app.slug}\`
- **Keymaps**: ${app.keymaps.length}
- **Total shortcuts**: ${totalShortcuts}
- **Platforms**: ${platformsText}
${app.bundleId ? `- **Bundle ID**: \`${app.bundleId}\`` : ""}
${app.hostname ? `- **Hostname**: \`${app.hostname}\`` : ""}
${app.source ? `- **Source**: ${app.source}` : ""}

### Keymaps included
${app.keymaps.map((km) => `- ${km.title} (${km.sections.length} sections)`).join("\n")}

### Checklist
- [ ] App name and slug are correct
- [ ] Shortcuts are accurate and tested
- [ ] Key format follows project conventions (e.g., \`cmd+s\`, \`ctrl+shift+p\`)
`;
}
