"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { DailyMood } from "@/lib/db/schema"

export const DailyMoodColors: {
    [key: number]: string
} = {
    0: "bg-red-700/30 border border-red-500 dark:bg-red-700",
    1: "bg-blue-400/30 border border-blue-500 dark:bg-blue-600",
    2: "bg-amber-300/30 border border-amber-500 dark:bg-amber-600",
    3: "bg-green-400/30 border border-green-500 dark:bg-green-400",
    4: "bg-green-800/30 border border-green-500 dark:bg-green-800",
}

export type TaskCount = {
    completed_count: number
    uncompleted_count: number
    due: string
}

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    taskCounts?: TaskCount[]
    dailyMoods?: DailyMood.Select[]
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    taskCounts = [],
    dailyMoods = [],
    selected,
    ...props
}: CalendarProps) {
    // Function to get task count for a specific date
    const getTaskCountForDate = (date: Date) => {
        // Find task count for this date (comparing just the date part)
        const taskData = taskCounts.find((task) => new Date(task.due).toDateString() === date.toDateString())
        return taskData?.uncompleted_count || 0
    }

    // Function to get mood for a specific date
    const getMoodForDate = (date: Date) => {
        // Find mood for this date (comparing just the date part)
        const moodData = dailyMoods.find((mood) => {
            const moodDate = mood.date instanceof Date ? mood.date : new Date(mood.date)
            return moodDate.toDateString() === date.toDateString()
        })
        return moodData?.mood ?? -1 // Return -1 if no mood is found
    }

    // Function to get mood color class based on mood value
    const getMoodColorClass = (mood: number) => {
        if (mood === -1) return "" // No color for mood -1
        return DailyMoodColors[mood] || ""
    }

    // Function to check if a date is selected
    const isDateSelected = (date: Date) => {
        if (!selected) return false

        // Handle both single date and date range selections
        if (Array.isArray(selected)) {
            return selected.some((selectedDate) => selectedDate instanceof Date && selectedDate.toDateString() === date.toDateString())
        } else if (selected instanceof Date) {
            return selected.toDateString() === date.toDateString()
        } else if (selected && typeof selected === 'object' && "from" in selected) {
            // Handle date range
            const { from, to } = selected
            if (!from) return false
            if (!to) return from.toDateString() === date.toDateString()

            // Check if date is within range
            return date >= new Date(from.setHours(0, 0, 0, 0)) && date <= new Date(to.setHours(23, 59, 59, 999))
        }

        return false
    }

    return ( 
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-2 h-fit", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 lg:hover:opacity-100",
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-7 md:w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-10 lg:h-9 w-7 md:w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 lg:h-9 w-7 md:w-9 p-0 font-normal aria-selected:opacity-100 relative",
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground lg:hover:bg-primary lg:hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
                DayContent: (props) => {
                    const taskCount = getTaskCountForDate(props.date)
                    const maxDots = 5 // Maximum number of dots to display
                    const dotsToShow = Math.min(taskCount, maxDots)

                    // Get mood for this date
                    const mood = getMoodForDate(props.date)
                    const moodColorClass = getMoodColorClass(mood)

                    // Check if this date is selected
                    const isSelected = isDateSelected(props.date)

                    // Determine if today for styling - using full date comparison

                    return (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                            {/* Mood indicator as background */}
                            {mood !== -1 && (
                                <div
                                    className={`absolute inset-0.5 rounded opacity-30 ${moodColorClass}`}
                                    aria-hidden="true"
                                    style={{ pointerEvents: "none" }}
                                />
                            )}

                            {/* Date number */}
                            <div className="mb-1 relative z-10">{props.date.getDate()}</div>

                            {/* Task count dots */}
                            {taskCount > 0 && (
                                <div className="grid grid-cols-3 lg:grid-cols-5 justify-center gap-0.5 absolute bottom-1 z-10">
                                    {Array.from({ length: dotsToShow }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"
                                                }`}
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                },
            }}
            selected={selected as any}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
