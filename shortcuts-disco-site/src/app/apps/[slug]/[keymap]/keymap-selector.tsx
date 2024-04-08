import * as React from "react"
import {ChevronsUpDown} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"
import {Keymap} from "@/lib/model/internal/internal-models";
import Link from "next/link";
import {serializeKeymap} from "@/lib/model/keymap-utils";

interface KeymapSelectorProps {
    keymaps: Keymap[],
    activeKeymap: string,
}

export function KeymapSelector({keymaps, activeKeymap}: KeymapSelectorProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {activeKeymap}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                {keymaps.map((keymap) => (
                    <Link href={serializeKeymap(keymap)}
                          passHref
                          key={keymap.title}
                          className="block cursor-pointer hover:bg-slate-100/50 px-2 py-2">
                        {keymap.title}
                    </Link>
                ))}
            </PopoverContent>
        </Popover>
    )
}
