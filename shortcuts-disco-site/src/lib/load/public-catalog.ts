import { ShortcutsParser } from "./input-parser";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";

export const PUBLIC_CATALOG_URL = "/data/combined-apps.json";

let pending: Promise<AppShortcuts[]> | undefined;

async function fetchPublicCatalog(): Promise<AppShortcuts[]> {
  const response = await fetch(PUBLIC_CATALOG_URL);
  if (!response.ok) {
    throw new Error(
      `Couldn’t load the shortcut catalog (HTTP ${response.status}).`,
    );
  }
  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("list" in data) ||
    !Array.isArray(data.list)
  ) {
    throw new Error("The shortcut catalog has an unexpected format.");
  }
  // The build already validated this file; parse it into the same model the server uses.
  return new ShortcutsParser().parseInputShortcuts(data.list);
}

/**
 * Loads the full public catalog once per page session. Concurrent callers
 * share one request; a failed request is forgotten so callers can retry.
 */
export function loadPublicCatalog(): Promise<AppShortcuts[]> {
  pending ??= fetchPublicCatalog().catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

export function resetPublicCatalogCache(): void {
  pending = undefined;
}
