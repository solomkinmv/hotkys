import { Action, ActionPanel, Icon, List } from "@raycast/api";
import AppShortcuts from "./app-shortcuts";
import { useApps } from "./load/apps-provider";
import type { FavoriteIdentifier } from "./user-data/favorites";
import type { Favorite } from "./user-data/models";
import { resolveFavoriteItem } from "./user-data/view-models";
import { FavoriteAction } from "./view/favorite-action";

export default function MyFavoritesCommand() {
  const { isLoading, data: apps, favorites, toggleFavorite } = useApps(true);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search favorites" navigationTitle="My Favorites">
      {favorites.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No favorites yet"
          description="Add apps and shortcuts from any Hotkys list."
          icon={Icon.Star}
        />
      ) : null}
      {favorites.map((favorite) => {
        const item = resolveFavoriteItem(favorite, apps);
        const identifier = toIdentifier(favorite);
        return (
          <List.Item
            key={item.id}
            icon={iconFor(favorite)}
            title={item.title}
            subtitle={item.subtitle}
            actions={
              <ActionPanel>
                {item.appSlug ? (
                  <Action.Push
                    title="Show Shortcuts"
                    target={
                      <AppShortcuts
                        slug={item.appSlug}
                        initialKeymapTitle={item.keymapTitle}
                        initialSearchText={item.searchText}
                      />
                    }
                  />
                ) : null}
                <FavoriteAction identifier={identifier} favorites={favorites} onToggle={toggleFavorite} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function toIdentifier(favorite: Favorite): FavoriteIdentifier {
  return {
    itemType: favorite.itemType,
    appSlug: favorite.appSlug,
    customAppId: favorite.customAppId,
    keymapTitle: favorite.keymapTitle,
    sectionTitle: favorite.sectionTitle,
    shortcutTitle: favorite.shortcutTitle,
    baseShortcutId: favorite.baseShortcutId,
  };
}

function iconFor(favorite: Favorite): Icon {
  if (favorite.itemType === "app") return Icon.AppWindow;
  if (favorite.itemType === "keymap") return Icon.List;
  return Icon.Keyboard;
}
