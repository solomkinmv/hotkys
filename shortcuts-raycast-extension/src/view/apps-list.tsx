import { Action, ActionPanel, Icon, Image, List } from "@raycast/api";
import { getAvatarIcon, useFrecencySorting } from "@raycast/utils";
import AppShortcuts from "../app-shortcuts";
import type { AppMetadata } from "../model/input/input-models";
import type { FavoriteIdentifier } from "../user-data/favorites";
import type { Favorite, UserCustomizations } from "../user-data/models";
import { type AppsFilter, selectAppsByFilter } from "../user-data/view-models";
import { FavoriteAction } from "./favorite-action";

const BASE_URL = "https://hotkys.com";

interface AppsListProps {
  apps: AppMetadata[];
  customizations: UserCustomizations | undefined;
  favorites: Favorite[];
  filter: AppsFilter;
  isLoading: boolean;
  onFilterChange: (filter: AppsFilter) => void;
  onToggleFavorite: (identifier: FavoriteIdentifier) => Promise<void>;
}

export function AppsList({
  apps,
  customizations,
  favorites,
  filter,
  isLoading,
  onFilterChange,
  onToggleFavorite,
}: AppsListProps) {
  const filteredApps = selectAppsByFilter(apps, customizations, favorites, filter);
  const { data: sortedApps, visitItem } = useFrecencySorting(filteredApps, {
    key: (app) => app.slug,
  });

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search applications"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter Applications"
          value={filter}
          onChange={(value) => onFilterChange(value as AppsFilter)}
        >
          <List.Dropdown.Item title="All Apps" value="all" />
          <List.Dropdown.Item title="My Apps" value="customized" />
          <List.Dropdown.Item title="Favorites" value="favorites" />
        </List.Dropdown>
      }
    >
      {sortedApps.length === 0 && !isLoading ? (
        <List.EmptyView title={emptyTitleFor(filter)} icon={Icon.AppWindow} />
      ) : null}
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

function emptyTitleFor(filter: AppsFilter): string {
  if (filter === "customized") return "No custom applications or shortcuts";
  if (filter === "favorites") return "No favorite applications";
  return "No applications found";
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
