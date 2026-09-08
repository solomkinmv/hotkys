"use client";
import { customAppHref } from "@/lib/navigation/shortcut-routes";

import { useState, useMemo } from "react";
import { AppShortcuts, Platform } from "@/lib/model/internal/internal-models";
import Fuse from "fuse.js";
import { Kbd } from "@/components/ui/kbd";
import { InputProps } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/search-bar";
import { LinkableListItem } from "@/components/ui/list";
import { HeaderCompact1, TypographyMuted } from "@/components/ui/typography";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";
import { Badge } from "@/components/ui/badge";
import { getAppPlatforms, getPlatformIcon, appMatchesPlatformFilter } from "@/lib/utils/platform-helpers";
import { getPlatformDisplay } from "@/lib/utils";
import { usePlatformFilter } from "@/lib/hooks/use-platform-filter";
import { PlatformFilter } from "@/components/ui/platform-filter";
import { AppIcon } from "@/components/ui/app-icon";
import { usePlatform } from "@/lib/hooks/use-platform";
import { serializeKeymap } from "@/lib/model/keymap-utils";
import { useMergedShortcuts } from "@/lib/hooks/use-merged-shortcuts";

const CUSTOM_APP_SLUG_PREFIX = "custom-";

/**
 * ApplicationList component displays a searchable, keyboard-navigable list of applications
 * 
 * @param applications Array of application shortcuts to display
 */
function getAppKeymapUrl(app: AppShortcuts, userPlatform: Platform): string {
  if (isCustomApp(app)) {
    return customAppHref(app.slug.replace(/^custom-/, ""));
  }

  const bestKeymap = app.keymaps.find(k => k.platforms?.includes(userPlatform)) ?? app.keymaps[0];
  if (!bestKeymap) {
    return `/apps/${app.slug}`;
  }
  return `/apps/${app.slug}/${serializeKeymap(bestKeymap)}`;
}

function isCustomApp(app: AppShortcuts): boolean {
  return app.slug.startsWith(CUSTOM_APP_SLUG_PREFIX);
}

export const ApplicationList = ({
  applications,
}: {
  applications: AppShortcuts[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const userPlatform = usePlatform();
  const { platformFilter, setPlatformFilter } = usePlatformFilter();
  const { applications: mergedApplications } = useMergedShortcuts(applications);

  // Apply platform filter first, then search
  const filteredByPlatform = useMemo(() => {
    return mergedApplications.filter((app) =>
      appMatchesPlatformFilter(app, platformFilter)
    );
  }, [mergedApplications, platformFilter]);

  // Setup fuzzy search with Fuse.js on platform-filtered apps
  const fuse = useMemo(() => {
    return new Fuse(filteredByPlatform, {
      keys: ["name"],
      includeScore: true,
      includeMatches: true,
    });
  }, [filteredByPlatform]);

  // Apply search filter
  const appShortcuts = useMemo(() => {
    if (!searchTerm) {
      return filteredByPlatform;
    }
    return fuse.search(searchTerm).map((result) => result.item);
  }, [searchTerm, filteredByPlatform, fuse]);

  // Use custom hook for keyboard navigation
  const { selectedIndex, itemRefs } = useKeyboardNavigation<AppShortcuts>(
    appShortcuts,
    undefined,
    (app) => getAppKeymapUrl(app, userPlatform),
    { resetKey: appShortcuts.map(app => app.slug).join("|") }
  );

  // Handle search input changes
  const onChange: InputProps["onChange"] = (e) => {
    setSearchTerm(e.currentTarget.value);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <HeaderCompact1 className="mt-0 mb-0">All Applications</HeaderCompact1>
        <PlatformFilter
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
        />
      </div>
      <SearchBar onChange={onChange} />
      <div className="mt-2">
        {appShortcuts.length === 0 ? (
          <TypographyMuted className="text-center py-8">
            No applications found matching your filter criteria.
          </TypographyMuted>
        ) : (
          appShortcuts.map((app, index) => {
            const platforms = getAppPlatforms(app);
            return (
              <LinkableListItem
                key={app.slug}
                to={getAppKeymapUrl(app, userPlatform)}
                selected={index === selectedIndex}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
              >
                <span className="flex items-center gap-2 not-prose">
                  <AppIcon icon={app.icon} appName={app.name} size="sm" />
                  {app.name}
                </span>
                <div className="flex items-center gap-1">
                  {platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant="outline"
                      className="text-xs"
                      aria-label={`Platform: ${getPlatformDisplay(platform)}`}
                      title={getPlatformDisplay(platform) || undefined}
                    >
                      {getPlatformIcon(platform)}
                    </Badge>
                  ))}
                  {isCustomApp(app) && (
                    <Badge variant="secondary" className="text-xs">
                      Custom
                    </Badge>
                  )}
                  {app.bundleId && <Kbd>{app.bundleId}</Kbd>}
                </div>
              </LinkableListItem>
            );
          })
        )}
      </div>
    </>
  );
};
