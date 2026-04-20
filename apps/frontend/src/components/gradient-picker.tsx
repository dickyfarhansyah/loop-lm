import { Paintbrush } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const solids = [
    "#E2E2E2",
    "#ff75c3",
    "#ffa647",
    "#ffe83f",
    "#9fff5b",
    "#70e2ff",
    "#cd93ff",
    "#09203f",
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
    "#000000",
    "#ffffff",
]

export function GradientPicker({
    background,
    setBackground,
    className,
}: {
    background: string
    setBackground: (background: string) => void
    className?: string
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-55 justify-start text-left font-normal",
                        !background && "text-muted-foreground",
                        className,
                    )}
                >
                    <div className="flex w-full items-center gap-2">
                        {background ? (
                            <div
                                className="h-4 w-4 rounded transition-all"
                                style={{ background }}
                            />
                        ) : (
                            <Paintbrush className="h-4 w-4" />
                        )}
                        <div className="flex-1 truncate">{background ? background : "Pick a color"}</div>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="flex flex-wrap gap-1">
                    {solids.map((s) => (
                        <div
                            key={s}
                            style={{ background: s }}
                            className="h-6 w-6 cursor-pointer rounded-md active:scale-105"
                            onClick={() => setBackground(s)}
                        />
                    ))}
                </div>

                <Input
                    id="custom"
                    value={background}
                    className="col-span-2 mt-4 h-8"
                    onChange={(e) => setBackground(e.currentTarget.value)}
                />
            </PopoverContent>
        </Popover>
    )
}
