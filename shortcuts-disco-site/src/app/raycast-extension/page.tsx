import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { createCanonical, createOpenGraph } from "@/lib/seo-utils";

export const metadata: Metadata = {
    title: "Raycast Extension - Search and Run Shortcuts",
    description: "Search and run keyboard shortcuts for supported Mac apps and websites, directly from Raycast. Install the free Hotkys extension.",
    alternates: createCanonical("/raycast-extension"),
    openGraph: createOpenGraph(
        "/raycast-extension",
        "Raycast Extension - Search and Run Shortcuts",
        "Search and run keyboard shortcuts for supported Mac apps and websites, directly from Raycast. Install the free Hotkys extension.",
    ),
};

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl">
      <section aria-labelledby="raycast-title" className="hero-enter grid items-center gap-8 pb-12 lg:grid-cols-[0.95fr_1.1fr] lg:gap-12">
        <div className="py-4 md:py-6">
          <p className="mb-5 text-sm font-medium text-muted-foreground">Hotkys for Raycast · macOS</p>
          <h1 id="raycast-title" className="text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[1.06] font-semibold tracking-[-0.065em]">
            Find it. Run it.{" "}<span className="block text-brand">Stay in the flow.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Search the shortcuts for your current app, then run one without leaving Raycast.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <a href="https://www.raycast.com/solomkinmv/shortcuts-search" target="_blank" rel="noopener noreferrer">Install the extension <ArrowUpRight className="size-4" aria-hidden="true" /></a>
            </Button>
            <Button asChild variant="ghost" className="rounded-xl">
              <a href="#commands">See the commands <ArrowDown className="size-4" aria-hidden="true" /></a>
            </Button>
          </div>
        </div>
        <Image
          src="/media/shortcuts-search-4.webp"
          alt="Raycast search for tab actions, showing Safari shortcuts and the Apply action"
          width={2000}
          height={1250}
          preload
          sizes="(max-width: 1023px) 90vw, 600px"
          className="w-full rounded-2xl border shadow-sm"
        />
      </section>

      <section aria-labelledby="workflow-title" className="border-y py-8 md:py-10">
        <h2 id="workflow-title" className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">From a search to a shortcut.</h2>
        <ol className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <li>
            <h3 className="flex items-center gap-3 text-sm font-semibold"><span aria-hidden="true" className="font-mono text-brand">1</span>Open your app’s shortcuts</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Run List Current Shortcuts in Raycast to see the actions for the app in front of you.</p>
          </li>
          <li>
            <h3 className="flex items-center gap-3 text-sm font-semibold"><span aria-hidden="true" className="font-mono text-brand">2</span>Find the action</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Type what you want to do, like “tab” or “bookmark”, to narrow the list.</p>
          </li>
          <li>
            <h3 className="flex items-center gap-3 text-sm font-semibold"><span aria-hidden="true" className="font-mono text-brand">3</span>Press <Kbd>Return</Kbd></h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Apply the selected key combination to your app and get back to work.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="screenshots-title" className="py-12 md:py-16">
        <h2 id="screenshots-title" className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">Pick an app. Find an action.</h2>
        <div className="mt-7 grid grid-cols-1 gap-8 md:grid-cols-2">
          <figure className="min-w-0">
            <Image src="/media/shortcuts-search-1.webp" alt="Raycast lists supported applications, including Safari, Slack, and Xcode" width={2000} height={1250} sizes="(max-width: 767px) 90vw, 560px" className="w-full rounded-2xl border" />
            <figcaption className="mt-4">
              <h3 className="text-base font-semibold tracking-tight">Your collection, one search away.</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Browse the Hotkys catalog directly from Raycast. Choose an app to explore its shortcuts.</p>
            </figcaption>
          </figure>
          <figure className="min-w-0">
            <Image src="/media/shortcuts-search-3.webp" alt="Safari shortcuts grouped by bookmarks, webpage actions, and tabs in Raycast" width={2000} height={1250} sizes="(max-width: 767px) 90vw, 560px" className="w-full rounded-2xl border" />
            <figcaption className="mt-4">
              <h3 className="text-base font-semibold tracking-tight">Less searching through menus.</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">See an app’s actions and key combinations together. Search for an action, then select it to run.</p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="commands" aria-labelledby="commands-title" className="grid grid-cols-1 gap-8 rounded-2xl border bg-card p-6 md:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div>
          <h2 id="commands-title" className="max-w-sm text-2xl leading-tight font-semibold tracking-[-0.035em] md:text-3xl">A command for the way you work.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Browse every app, jump to the one you’re using, or find shortcuts for a supported website.</p>
          <div className="mt-6 max-w-sm space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Made for Raycast on macOS. Web app detection supports Safari, Chrome, and Arc.</p>
            <p>New to Raycast? <Link href="https://www.raycast.com" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-brand">Get Raycast</Link> to use the extension.</p>
          </div>
        </div>
        <dl className="space-y-6">
          <div>
            <dt className="text-sm font-semibold">List All Shortcuts</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">Browse the full catalog of desktop and web apps, then open an app’s shortcuts.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">List Current Shortcuts</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">Find shortcuts for the supported desktop app that’s currently in front.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">List Current Web Shortcuts</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">Find shortcuts for the supported web app open in your current browser tab.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">Copy Current App’s Bundle ID</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">Copy an app’s identifier when contributing new shortcuts to Hotkys.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
