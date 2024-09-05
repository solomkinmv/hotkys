import { closeMainWindow, PopToRootType } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { Application } from "./model/internal/internal-models";
import useAllShortcuts from "./load/shortcuts-provider";
import { getFrontmostHostname } from "./hooks/use-frontmost-hostname";
import { ShortcutsList } from "./view/shortcuts-list";

export default function WebShortcuts() {
  const [application, setApplication] = useState<Application>();
  const [hostname, setHostname] = useState<string>();

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

  usePromise(getFrontmostHostname, [], {
    onData: (fetchedHostname) => {
      if (!fetchedHostname) return;
      setHostname(fetchedHostname);
    },
  });

  return <ShortcutsList application={application} />;
}
