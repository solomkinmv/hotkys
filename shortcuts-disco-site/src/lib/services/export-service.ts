import type { CustomApp } from "@/lib/model/user/user-models";
import type { InputApp } from "@/lib/model/input/input-models";
import {
  convertCustomAppToInputApp,
  validateCustomApp,
} from "@/lib/services/custom-shortcut-validation";

export interface ExportResult {
  app: InputApp;
  json: string;
  prDescription: string;
}

export const exportService = {
  exportCustomApp(customApp: CustomApp): ExportResult {
    validateCustomApp(customApp);
    const inputApp = convertCustomAppToInputApp(customApp);
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
