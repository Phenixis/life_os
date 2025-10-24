"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const heights = ["h-1", "h-2", "h-3", "h-4", "h-5"]
const difficulties = ["Too Easy", "Easy", "Challenging", "Hard", "Too Hard"]
const colors = [{
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
}]

export function DifficultySelector({
    value,
    onChange,
    className
}: {
    value: 1 | 2 | 3 | 4 | 5
    onChange: (value: 1 | 2 | 3 | 4 | 5) => void
    className?: string
}) {
    return (
        <TooltipProvider>
            <div className={cn("flex justify-start items-end gap-2", className)}>
                {Array.from({ length: 5 }).map((_, index) => {
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
                                            heights[index],
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
