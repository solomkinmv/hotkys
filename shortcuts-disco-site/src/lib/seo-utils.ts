import { AppShortcuts, Keymap } from "@/lib/model/internal/internal-models";
import { getPlatformDisplay } from "@/lib/utils";
import { Metadata } from "next";

const SITE_URL = "https://hotkys.com";
const SITE_NAME = "Hotkys";
const MAX_DESCRIPTION_LENGTH = 160;
const MIN_DESCRIPTION_LENGTH = 110;
const DESCRIPTION_FILLER = " Free and searchable on Hotkys.";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

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
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    description += DESCRIPTION_FILLER;
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

export function createOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
    sameAs: [
      "https://github.com/solomkinmv/hotkys",
      "https://www.raycast.com/solomkinmv/shortcuts-search",
    ],
  };
}

export function createKeymapJsonLd(
  app: AppShortcuts,
  keymap: Keymap,
  path: string,
) {
  const url = `${SITE_URL}${path}`;
  const headline = `${app.name} Shortcuts`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline,
        description: generateKeymapDescription(app, keymap),
        url,
        mainEntityOfPage: url,
        image: `${url}/opengraph-image`,
        author: { "@id": ORGANIZATION_ID },
        publisher: {
          "@type": "Organization",
          "@id": ORGANIZATION_ID,
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "ItemList",
        name: `${headline} (${keymap.title})`,
        numberOfItems: keymap.sections.length,
        itemListElement: keymap.sections.map((section, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: section.title,
          url: `${url}#${encodeURIComponent(section.title)}`,
        })),
      },
    ],
  };
}
