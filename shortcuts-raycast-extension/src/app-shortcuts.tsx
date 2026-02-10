import { getFrontmostApplication } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { useAppShortcuts } from "./load/app-shortcuts-provider";
import { useApps } from "./load/apps-provider";
import { ShortcutsList } from "./view/shortcuts-list";
import { exitWithMessage } from "./view/exit-action";
import { getPlatform } from "./load/platform";

interface FrontmostAppInfo {
  appId: string | undefined;
  appName: string | undefined;
}

interface AppShortcutsProps {
  slug?: string;
}

export default function AppShortcuts(props?: AppShortcutsProps) {
  const [slug, setSlug] = useState<string | undefined>(props?.slug);

  const { isLoading: appsLoading, data: apps } = useApps();
  const { isLoading: shortcutsLoading, data: application } = useAppShortcuts(slug);

  // Get the frontmost application's bundleId (macOS) or windowsAppId (Windows) if no slug provided
  const { isLoading: appIdLoading, data: frontmostApp } = usePromise(
    async (): Promise<FrontmostAppInfo> => {
      try {
        const app = await getFrontmostApplication();
        const appId = getPlatform() === "windows" ? app.windowsAppId : app.bundleId;
        return { appId, appName: app.name };
      } catch {
        return { appId: undefined, appName: undefined };
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
    if (!frontmostApp?.appId && !frontmostApp?.appName) {
      exitWithMessage("Could not detect the frontmost application");
      return;
    }
    const platform = getPlatform();
    let foundApp = apps.find((app) =>
      platform === "windows" ? app.windowsAppId === frontmostApp.appId : app.bundleId === frontmostApp.appId
    );
    // Fallback: match by app name when windowsAppId is not available in the data
    if (!foundApp && frontmostApp.appName) {
      const normalizedName = frontmostApp.appName.toLowerCase();
      foundApp = apps.find((app) => app.name.toLowerCase() === normalizedName);
    }
    if (!foundApp) {
      exitWithMessage(`Shortcuts not available for application ${frontmostApp.appId ?? frontmostApp.appName}`);
      return;
    }
    setSlug(foundApp.slug);
  }, [frontmostApp, appIdLoading, slug, apps, appsLoading]);

  const isLoading = appsLoading || shortcutsLoading || (!props?.slug && appIdLoading);

  return <ShortcutsList application={application} isLoading={isLoading} />;
}
