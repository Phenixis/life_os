"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

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
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    return (
        <div className={cn("flex justify-start items-end gap-2", className)}>
            {Array.from({ length: 5 }).map((_, index) => {
                const difficultyLevel = (index + 1) as 1 | 2 | 3 | 4 | 5
                const isActive = value === difficultyLevel
                const isHovered = hoveredIndex === index

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onChange(difficultyLevel)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="group relative cursor-pointer"
                        title={difficulties[index]}
                    >
                        <div
                            className={cn(
                                heights[index],
                                "w-3 rounded-sm transition-all",
                                isActive || isHovered
                                    ? colors[index].active
                                    : colors[index].passive
                            )}
                        />
                        {(isHovered || isActive) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-popover border rounded shadow-sm whitespace-nowrap">
                                {difficulties[index]}
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
