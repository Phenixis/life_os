"use client"

import {cn} from "@/lib/utils"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {colors, difficulties, heights} from "@/components/big/workout/past-workout/difficulty";

export function DifficultySelector(
    {
        value,
        onChange,
        className
    }: {
        value: 1 | 2 | 3 | 4 | 5
        onChange: (value: 1 | 2 | 3 | 4 | 5) => void
        className?: string
    }
) {
    return (
        <TooltipProvider>
            <div className={cn("flex justify-start items-end gap-2", className)}>
                {Array.from({length: 5}).map((_, index) => {
                    const difficultyLevel = (index + 1) as 1 | 2 | 3 | 4 | 5
                    const isActive = value === difficultyLevel

                    return (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => onChange(difficultyLevel)}
                                    className="cursor-pointer"
                                >
                                    <div
                                        className={cn(
                                            heights[index * 2],
                                            "w-3 rounded-sm transition-all",
                                            isActive
                                                ? colors[index].active
                                                : colors[index].passive
                                        )}
                                    />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={5}>
                                {difficulties[index]}
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </TooltipProvider>
    )
}
