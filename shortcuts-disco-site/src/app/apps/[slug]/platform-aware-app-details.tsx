"use client";

import {AppShortcuts} from "@/lib/model/internal/internal-models";
import {AppDetails} from "@/app/apps/[slug]/[keymap]/app-details";
import {usePlatform} from "@/lib/hooks/use-platform";

interface Props {
    application: AppShortcuts;
}

/**
 * Client component that selects the appropriate keymap based on the user's platform.
 * Wraps AppDetails with platform-aware keymap selection.
 */
export function PlatformAwareAppDetails({application}: Props) {
    const userPlatform = usePlatform();

    // Select first keymap matching user's platform, or first keymap if no match
    const keymap = application.keymaps.find(k => k.platforms?.includes(userPlatform))
                  || application.keymaps[0];

    return <AppDetails application={application} keymap={keymap}/>;
}
