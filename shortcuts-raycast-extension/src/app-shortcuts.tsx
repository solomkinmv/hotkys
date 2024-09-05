import { closeMainWindow, getFrontmostApplication, PopToRootType } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { Application, Keymap, Section } from "./model/internal/internal-models";
import useAllShortcuts from "./load/shortcuts-provider";
import { ShortcutsList } from "./view/shortcuts-list";

interface Preferences {
  delay: string;
}

export default function AppShortcuts(props?: { app: Application }) {
  const [application, setApplication] = useState<Application | undefined>(props?.app);
  const [bundleId, setBundleId] = useState(props?.app?.bundleId);
  const [keymaps, setKeymaps] = useState<string[]>([]);
  const [keymapSections, setKeymapSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const shortcutsProviderResponse = useAllShortcuts({ execute: !props?.app });

  useEffect(() => {
    if (application || shortcutsProviderResponse.isLoading || !bundleId) {
      return;
    }
    const foundApp = shortcutsProviderResponse.data.applications.find((app) => app.bundleId === bundleId);
    if (!foundApp) {
      // noinspection JSIgnoredPromiseFromCall
      closeMainWindow({ clearRootSearch: true, popToRootType: PopToRootType.Immediate });
      // noinspection JSIgnoredPromiseFromCall
      showFailureToast(undefined, { title: `Shortcuts not available for application ${bundleId}` });
      return;
    }
    setApplication(foundApp);
  }, [shortcutsProviderResponse.isLoading, bundleId, application]);

  useEffect(() => {
    if (!application) return;
    const foundKeymaps = application?.keymaps.map((k) => k.title) ?? [];
    const foundSections = application?.keymaps[0].sections ?? [];
    setKeymaps(foundKeymaps);
    setKeymapSections(foundSections);
    setIsLoading(false);
  }, [application]);

  usePromise(async () => application?.bundleId ?? (await getFrontmostApplication()).bundleId, [], {
    onData: (bundleId) => {
      if (!bundleId) return;
      setBundleId(bundleId);
    },
    execute: !props?.app,
  });

  const onKeymapChange = (newValue: string) => {
    setKeymapSections(selectKeymap(application?.keymaps ?? [], newValue)?.sections ?? []);
  };

  return (
    <ShortcutsList
      isLoading={isLoading}
      application={application}
      keymaps={keymaps}
      onKeymapChange={onKeymapChange}
      keymapSections={keymapSections}
    />
  );
}

function selectKeymap(keymaps: Keymap[], keymapName: string): Keymap | undefined {
  return keymaps.find((keymap) => keymap.title === keymapName);
}
