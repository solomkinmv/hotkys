import * as React from "react"
import {ChevronsUpDown} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"
import {Keymap} from "@/lib/model/internal/internal-models";
import Link from "next/link";
import {serializeKeymap} from "@/lib/model/keymap-utils";
import {Badge} from "@/components/ui/badge";

interface KeymapSelectorProps {
    keymaps: Keymap[],
    activeKeymap: string,
    urlPrefix: string,
}

// Helper function to get platform display name
const getPlatformDisplay = (platform?: 'windows' | 'linux' | 'macos') => {
    if (!platform) return null;

    switch (platform) {
        case 'windows':
            return 'Windows';
        case 'linux':
            return 'Linux';
        case 'macos':
            return 'macOS';
        default:
            return null;
    }
};

export function KeymapSelector({keymaps, activeKeymap, urlPrefix}: KeymapSelectorProps) {
    const [open, setOpen] = React.useState(false)

    // Find the active keymap object
    const activeKeymapObj = keymaps.find(k => k.title === activeKeymap);
    const activePlatform = activeKeymapObj?.platform;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between w-[200px]"
                >
                    <div className="flex items-center">
                        {activeKeymap}
                        {activePlatform && (
                            <Badge variant="outline" className="ml-2 text-xs">
                                {getPlatformDisplay(activePlatform)}
                            </Badge>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[200px]">
                {keymaps.map((keymap) => (
                    <Link href={`${urlPrefix}/${serializeKeymap(keymap)}`}
                          passHref
                          key={keymap.title}
                          className="block cursor-pointer px-2 py-2 hover:bg-slate-100/50 flex items-center justify-between">
                        <span>{keymap.title}</span>
                        {keymap.platform && (
                            <Badge variant="outline" className="text-xs">
                                {getPlatformDisplay(keymap.platform)}
                            </Badge>
                        )}
                    </Link>
                ))}
            </PopoverContent>
        </Popover>
    )
}
