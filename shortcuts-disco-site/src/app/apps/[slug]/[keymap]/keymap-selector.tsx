import * as React from "react"
import {ChevronsUpDown} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"
import {Keymap} from "@/lib/model/internal/internal-models";
import Link from "next/link";
import {serializeKeymap} from "@/lib/model/keymap-utils";
import {Badge} from "@/components/ui/badge";
import {getPlatformDisplay} from "@/lib/utils";

interface KeymapSelectorProps {
    keymaps: Keymap[],
    activeKeymap: string,
    urlPrefix: string,
}

export function KeymapSelector({keymaps, activeKeymap, urlPrefix}: KeymapSelectorProps) {
    const [open, setOpen] = React.useState(false)

    // Find the active keymap object
    const activeKeymapObj = keymaps.find(k => k.title === activeKeymap);
    const activePlatforms = activeKeymapObj?.platforms ?? [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between w-full"
                >
                    <div className="flex items-center gap-1">
                        {activeKeymap}
                        {activePlatforms.map((platform) => (
                            <Badge key={platform} variant="outline" className="ml-2 text-xs" aria-label={`Platform: ${getPlatformDisplay(platform)}`}>
                                {getPlatformDisplay(platform)}
                            </Badge>
                        ))}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full">
                {keymaps.map((keymap) => (
                    <Link href={`${urlPrefix}/${serializeKeymap(keymap)}`}
                          passHref
                          key={keymap.title}
                          className="block cursor-pointer px-2 py-2 hover:bg-accent flex items-center justify-between">
                        <span>{keymap.title}</span>
                        <div className="flex items-center gap-1">
                            {keymap.platforms?.map((platform) => (
                                <Badge key={platform} variant="outline" className="text-xs" aria-label={`Platform: ${getPlatformDisplay(platform)}`}>
                                    {getPlatformDisplay(platform)}
                                </Badge>
                            ))}
                        </div>
                    </Link>
                ))}
            </PopoverContent>
        </Popover>
    )
}
