import { useMemo } from "react";
import { useApps } from "./load/apps-provider";
import { selectCustomizedApps } from "./user-data/view-models";
import { AppsList } from "./view/apps-list";

export default function MyShortcutsCommand() {
  const { isLoading, data: apps, customizations, favorites, toggleFavorite } = useApps(true);
  const customizedApps = useMemo(
    () => (customizations ? selectCustomizedApps(apps, customizations) : []),
    [apps, customizations]
  );

  return (
    <AppsList
      apps={customizedApps}
      favorites={favorites}
      isLoading={isLoading}
      emptyTitle="No custom shortcuts yet"
      navigationTitle="My Shortcuts"
      onToggleFavorite={toggleFavorite}
    />
  );
}
