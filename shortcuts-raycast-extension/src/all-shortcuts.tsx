import { useApps } from "./load/apps-provider";
import { AppsList } from "./view/apps-list";

export default function AllShortcutsCommand() {
  const { isLoading, data: apps, favorites, toggleFavorite } = useApps();

  return <AppsList apps={apps} favorites={favorites} isLoading={isLoading} onToggleFavorite={toggleFavorite} />;
}
