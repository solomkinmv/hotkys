import {ApplicationList} from "@/components/list/application-list";
import {getAllShortcuts} from "@/lib/shortcuts";
import {Metadata} from "next";
import {createCanonical, createOpenGraph} from "@/lib/seo-utils";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Keyboard Shortcuts Cheat Sheets for Popular Apps",
    description: "Browse keyboard shortcuts for 60+ popular applications including Figma, VS Code, Slack, and more. Search and master shortcuts for macOS, Windows, and Linux.",
    alternates: createCanonical(""),
    openGraph: createOpenGraph(
        "",
        "Keyboard Shortcuts Cheat Sheets for Popular Apps",
        "Browse keyboard shortcuts for 60+ popular applications including Figma, VS Code, Slack, and more. Search and master shortcuts for macOS, Windows, and Linux.",
    ),
};

const AllApplicationsPage = () => {
    const allAppShortcuts = getAllShortcuts();
    return (
        <div className="mx-auto max-w-6xl">
            <section aria-labelledby="hero-title" className="hero-enter grid items-center gap-4 pb-10 md:grid-cols-[1.05fr_1fr] md:gap-8">
                <div className="py-4 md:py-6">
                    <p className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <span className="inline-flex size-6 items-center justify-center rounded-md border bg-card font-mono text-xs" aria-hidden="true">⌘</span>
                        A little shortcut to better work
                    </p>
                    <h1 id="hero-title" className="max-w-xl text-[clamp(2.75rem,5.5vw,4.25rem)] leading-[1.06] font-semibold tracking-[-0.065em]">
                        Less clicking.<span className="block text-brand">More clacking.</span>
                    </h1>
                    <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                        Find the right keyboard shortcuts for your favorite apps. Keep them close. Make them second nature.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Button asChild size="lg" className="rounded-xl">
                            <a href="#applications">Explore apps <ArrowDown className="size-4" aria-hidden="true" /></a>
                        </Button>
                        <Button asChild variant="ghost" className="rounded-xl">
                            <Link href="/raycast-extension">Get the Raycast extension <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
                        </Button>
                    </div>
                </div>
                <div className="relative mx-auto w-full max-w-lg md:max-w-none">
                    <Image src="/media/keycaps-hero.webp" alt="Angled Q, W, E, A, and S keycaps in staggered keyboard rows, with an orange A key" width={1280} height={853} preload sizes="(max-width: 767px) 85vw, 560px" className="mx-auto h-52 w-auto object-contain sm:h-72 md:h-auto md:w-full" />
                </div>
            </section>
            <ApplicationList applications={allAppShortcuts.applications}/>
            <section className="mt-12 flex flex-col gap-5 border-t pt-8 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">Built for your everyday apps.</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Free to browse. Open source. Better with your contributions.</p>
                </div>
                <Button asChild variant="outline" className="rounded-xl">
                    <Link href="https://github.com/solomkinmv/shortcuts-disco">Contribute a shortcut <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
                </Button>
            </section>
        </div>
    );
};

export default AllApplicationsPage;
