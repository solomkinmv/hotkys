import { getFrontmostApplication } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { useAppShortcuts } from "./load/app-shortcuts-provider";
import { useApps } from "./load/apps-provider";
import { ShortcutsList } from "./view/shortcuts-list";
import { exitWithMessage } from "./view/exit-action";
import { getPlatform } from "./load/platform";

interface AppShortcutsProps {
  slug?: string;
}

export default function AppShortcuts(props?: AppShortcutsProps) {
  const [slug, setSlug] = useState<string | undefined>(props?.slug);

  const { isLoading: appsLoading, data: apps } = useApps();
  const { isLoading: shortcutsLoading, data: application } = useAppShortcuts(slug);

  // Get the frontmost application's bundleId (macOS) or windowsAppId (Windows) if no slug provided
  const { isLoading: appIdLoading, data: appId } = usePromise(
    async () => {
      try {
        const app = await getFrontmostApplication();
        return getPlatform() === "windows" ? app.windowsAppId : app.bundleId;
      } catch {
        return undefined;
      }
    },
    [],
    {
      execute: !props?.slug,
    }
  );

  // If we have an appId but no slug, look up the slug from apps list
  useEffect(() => {
    if (slug || appsLoading || appIdLoading) {
      return;
    }
    if (!appId) {
      exitWithMessage("Could not detect the frontmost application");
      return;
    }
    const platform = getPlatform();
    const foundApp = apps.find((app) => (platform === "windows" ? app.windowsAppId === appId : app.bundleId === appId));
    if (!foundApp) {
      exitWithMessage(`Shortcuts not available for application ${appId}`);
      return;
    }
    setSlug(foundApp.slug);
  }, [appId, appIdLoading, slug, apps, appsLoading]);

  const isLoading = appsLoading || shortcutsLoading || (!props?.slug && appIdLoading);

  return <ShortcutsList application={application} isLoading={isLoading} />;
}
