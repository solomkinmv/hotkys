import { Action, ActionPanel, Icon, Image, List } from "@raycast/api";
import { getAvatarIcon, useFrecencySorting } from "@raycast/utils";
import AppShortcuts from "../app-shortcuts";
import type { AppMetadata } from "../model/input/input-models";
import type { FavoriteIdentifier } from "../user-data/favorites";
import type { Favorite } from "../user-data/models";
import { FavoriteAction } from "./favorite-action";

const BASE_URL = "https://hotkys.com";

interface AppsListProps {
  apps: AppMetadata[];
  favorites: Favorite[];
  isLoading: boolean;
  emptyTitle?: string;
  navigationTitle?: string;
  onToggleFavorite: (identifier: FavoriteIdentifier) => Promise<void>;
}

export function AppsList({
  apps,
  favorites,
  isLoading,
  emptyTitle = "No applications found",
  navigationTitle,
  onToggleFavorite,
}: AppsListProps) {
  const { data: sortedApps, visitItem } = useFrecencySorting(apps, {
    key: (app) => app.slug,
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search applications" navigationTitle={navigationTitle}>
      {sortedApps.length === 0 && !isLoading ? <List.EmptyView title={emptyTitle} icon={Icon.AppWindow} /> : null}
      {sortedApps.map((app) => {
        const identifier: FavoriteIdentifier = {
          itemType: "app",
          appSlug: app.slug,
          customAppId: app.customAppId,
        };
        return (
          <List.Item
            key={app.slug}
            icon={getAppIcon(app)}
            title={app.name}
            subtitle={formatSubtitle(app)}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Show Shortcuts"
                  target={<AppShortcuts slug={app.slug} />}
                  onPush={() => visitItem(app)}
                />
                <FavoriteAction identifier={identifier} favorites={favorites} onToggle={onToggleFavorite} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function formatSubtitle(app: AppMetadata): string {
  return app.bundleId ?? app.hostname ?? "";
}

function getAppIcon(app: AppMetadata): Image.ImageLike {
  if (!app.icon) {
    return getAvatarIcon(app.name);
  }
  if (app.icon.startsWith("http://") || app.icon.startsWith("https://")) {
    return app.icon;
  }
  return `${BASE_URL}/${app.icon.startsWith("/") ? app.icon.slice(1) : app.icon}`;
}
