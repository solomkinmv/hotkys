import { closeMainWindow, PopToRootType } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { Application, Keymap, Section } from "./model/internal/internal-models";
import useAllShortcuts from "./load/shortcuts-provider";
import { getFrontmostHostname } from "./hooks/use-frontmost-hostname";
import { ShortcutsList } from "./view/shortcuts-list";

interface Preferences {
  delay: string;
}

export default function WebShortcuts() {
  const [application, setApplication] = useState<Application>();
  const [hostname, setHostname] = useState<string>();
  const [keymaps, setKeymaps] = useState<string[]>([]);
  const [keymapSections, setKeymapSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
