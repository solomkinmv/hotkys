import { AppShortcuts, Keymap } from "@/lib/model/internal/internal-models";
import { getPlatformDisplay } from "@/lib/utils";
import { Metadata } from "next";

const SITE_URL = "https://hotkys.com";
const SITE_NAME = "Hotkys";
const MAX_DESCRIPTION_LENGTH = 160;

export function generateKeymapDescription(
  app: AppShortcuts,
  keymap: Keymap,
): string {
  const platforms =
    keymap.platforms?.map(getPlatformDisplay).filter(Boolean).join("/") ??
    "keyboard";
  const totalShortcuts = keymap.sections.reduce(
    (sum, s) => sum + s.hotkeys.length,
    0,
  );
  const intro = `Complete ${platforms} keyboard shortcuts for ${app.name}. Master ${totalShortcuts} shortcuts across ${keymap.sections.length} ${keymap.sections.length === 1 ? "category" : "categories"}`;

  let description = `${intro}.`;
  for (let count = 1; count <= Math.min(3, keymap.sections.length); count++) {
    const names = keymap.sections
      .slice(0, count)
      .map((s) => s.title)
      .join(", ");
    const suffix = count < keymap.sections.length ? ", and more" : "";
    const candidate = `${intro} including ${names}${suffix}.`;
    if (candidate.length > MAX_DESCRIPTION_LENGTH) break;
    description = candidate;
  }
  return description;
}

export function createCanonical(path: string): Metadata["alternates"] {
  return {
    canonical: `${SITE_URL}${path}`,
  };
}

export const DEFAULT_OG_IMAGE = "/opengraph-image.jpg";

export function createOpenGraph(
  path: string,
  title: string,
  description: string,
  images?: string,
): Metadata["openGraph"] {
  return {
    type: "website",
    url: `${SITE_URL}${path}`,
    siteName: SITE_NAME,
    title,
    description,
    ...(images && { images }),
  };
}
