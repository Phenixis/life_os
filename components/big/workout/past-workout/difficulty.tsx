"use client"

import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {cn} from "@/lib/utils";
import {useState} from "react";

export const heights = ["h-1", "h-2", "h-3", "h-4", "h-5", "h-6", "h-7", "h-8", "h-9", "h-10"]
export const difficulties = ["Too Easy", "Easy", "Challenging", "Hard", "Too Hard"];
export const colors = [{
    active: "bg-blue-500/70",
    passive: "bg-blue-500/20"
}, {
    active: "bg-cyan-500/70",
    passive: "bg-cyan-500/20"
}, {
    active: "bg-green-500/70",
    passive: "bg-green-500/20"
}, {
    active: "bg-amber-500/70",
    passive: "bg-amber-500/20"
}, {
    active: "bg-red-500/70",
    passive: "bg-red-500/20"
}];

export function Difficulty(
    {
        value
    }: {
        value: 1 | 2 | 3 | 4 | 5
    }
) {
    const [tooltip, setTooltip] = useState<string | null>(null)

    return (
        <div className={"flex justify-end items-end gap-1"}>
            {
                Array.from({length: 5}).map((val, index) => {
                    return (
                        <Tooltip key={index}>
                            <TooltipTrigger
                                className={value === (index + 1) ? "" : "lg:hidden lg:group-hover/workout:block"}
                                onMouseEnter={() => setTooltip(difficulties[index])}>
                                <div
                                    className={cn(
                                        heights[index],
                                        " w-1 rounded-sm ",
                                        value === (index + 1) ? colors[index].active : colors[index].passive
                                    )}
                                />
                            </TooltipTrigger>
                            {
                                tooltip !== null ? (
                                    <TooltipContent side={"bottom"}>
                                        {tooltip}
                                    </TooltipContent>
                                ) : null
                            }
                        </Tooltip>
                    )
                })
            }
        </div>
    )
}