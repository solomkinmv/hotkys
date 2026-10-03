import { getAllShortcuts, getAppShortcutsBySlug } from "@/lib/shortcuts";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { keymapMatchesTitle, serializeKeymap } from "@/lib/model/keymap-utils";
import { AppDetails } from "@/app/apps/[slug]/[keymap]/app-details";
import { AppShortcuts, Keymap } from "@/lib/model/internal/internal-models";
import { Suspense } from "react";
import Link from "next/link";
import { getPlatformDisplay } from "@/lib/utils";
import {
  generateKeymapDescription,
  createCanonical,
  createOpenGraph,
} from "@/lib/seo-utils";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { appDescriptions } from "@/lib/app-descriptions";

interface Props {
  params: Promise<{ slug: string; keymap: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const app = getAppShortcutsBySlug(resolvedParams.slug);
  const appName = app?.name ?? "App";
  const keymap = app?.keymaps.find((km) =>
    keymapMatchesTitle(km, resolvedParams.keymap),
  );
  const description =
    app && keymap
      ? generateKeymapDescription(app, keymap)
      : `Keyboard shortcuts cheat sheet for ${appName}`;
  const path = `/apps/${resolvedParams.slug}/${resolvedParams.keymap}`;

  return {
    title: `${appName} Shortcuts`,
    description,
    alternates: createCanonical(path),
    openGraph: createOpenGraph(path, `${appName} Shortcuts`, description),
    twitter: {
      card: "summary_large_image",
      title: `${appName} Shortcuts`,
      description,
    },
  };
}

export async function generateStaticParams() {
  return getAllShortcuts().applications.flatMap((app) =>
    app.keymaps.map((keymap) => ({
      slug: app.slug,
      keymap: serializeKeymap(keymap),
    })),
  );
}

export default async function SingleApplicationPage({ params }: Props) {
  const resolvedParams = await params;
  const appShortcuts = getAppShortcutsBySlug(resolvedParams.slug) || notFound();
  const keymap = findKeymap(appShortcuts, resolvedParams.keymap) || notFound();

  return (
    <>
      <header className="mx-auto mb-8 max-w-6xl">
        <Link
          href="/#applications"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> All apps
        </Link>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-6">
            <AppIcon
              icon={appShortcuts.icon}
              appName={appShortcuts.name}
              size="md"
              className="size-14 rounded-2xl sm:size-18 [&_img]:object-contain"
            />
            <div className="min-w-0">
              <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.045em] sm:text-5xl">
                {appShortcuts.name}
                <span className="sr-only"> Keyboard Shortcuts</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {appDescriptions[appShortcuts.slug] ??
                  "Keyboard shortcuts for your everyday workflow."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {appShortcuts.source && (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={appShortcuts.source}>
                  View source{" "}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <FavoriteButton
              itemType="app"
              appSlug={appShortcuts.slug}
              showSignIn
              className="size-9 rounded-xl border bg-card"
            />
          </div>
        </div>
      </header>
      {appShortcuts.keymaps.length > 1 && (
        <nav className="sr-only" aria-label="Available keymaps">
          {appShortcuts.keymaps.map((km) => (
            <Link
              key={km.title}
              href={`/apps/${appShortcuts.slug}/${serializeKeymap(km)}`}
            >
              {km.title} ({km.platforms?.map(getPlatformDisplay).join(", ")})
            </Link>
          ))}
        </nav>
      )}
      <Suspense>
        <AppDetails application={appShortcuts} keymap={keymap} />
      </Suspense>
    </>
  );
}

const findKeymap = (
  app: AppShortcuts,
  serializedKeymapTitle: string,
): Keymap | undefined => {
  return app.keymaps.find((keymap) =>
    keymapMatchesTitle(keymap, serializedKeymapTitle),
  );
};
