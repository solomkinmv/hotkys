import type { Metadata } from "next";
import Link from "next/link";
import { getAllShortcuts } from "@/lib/shortcuts";
import { serializeKeymap } from "@/lib/model/keymap-utils";
import {
  createCanonical,
  createOpenGraph,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo-utils";

const TITLE = "All Apps - Keyboard Shortcut Cheat Sheets";
const DESCRIPTION =
  "Browse every app in the Hotkys catalog and jump straight to its macOS, Windows, or Linux keyboard shortcut cheat sheet.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: createCanonical("/all-apps"),
  openGraph: createOpenGraph("/all-apps", TITLE, DESCRIPTION, DEFAULT_OG_IMAGE),
};

export default function AllAppsPage() {
  const applications = [...getAllShortcuts().applications].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-4xl font-semibold tracking-[-0.055em] md:text-5xl">
        All apps
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Every app in the Hotkys catalog, with a cheat sheet for each of its
        keymaps. Pick a platform or mode to see its keyboard shortcuts.
      </p>
      <ul className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {applications.map((app) => (
          <li key={app.slug}>
            <h2 className="text-sm font-semibold">{app.name}</h2>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {app.keymaps.map((keymap) => (
                <li key={keymap.title}>
                  <Link
                    href={`/apps/${app.slug}/${serializeKeymap(keymap)}`}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {keymap.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
