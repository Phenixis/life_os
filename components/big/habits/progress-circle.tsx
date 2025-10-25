"use client"

import type { HabitFrequency, HabitWithCompletion } from "@/lib/types/habit"
import { useProgressCycle } from "@/hooks/use-progress-cycle"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { useMemo } from "react"

export function ProgressCircle({
    frequency = "daily",
    date,
    size = "size-6"
} : {
    frequency?: HabitFrequency
    date?: Date
    size?: "size-6" | "size-8" | "size-10" | "size-12"
}) {
    // Memoize the default date so it doesn't change on every render
    const stableDate = useMemo(() => date ?? new Date(), [date])

    const { data, isLoading, isError } = useProgressCycle({
        defaultFrequency: frequency,
        date: stableDate,
    })

    // Calculate overall progress percentage
    const calculateProgress = () => {
        if (!data?.progress?.habits || data.progress.habits.length === 0) {
            return 0
        }

        const completedHabits = data.progress.habits.filter((h: HabitWithCompletion) => h.isCompleted).length
        const totalHabits = data.progress.habits.length
        return Math.round((completedHabits / totalHabits) * 100)
    }

    // Get size values for the circle
    const getSizeValues = () => {
        switch (size) {
            case "size-6":
                return { width: 24, height: 24, strokeWidth: 2, radius: 10 }
            case "size-8":
                return { width: 32, height: 32, strokeWidth: 2, radius: 14 }
            case "size-10":
                return { width: 40, height: 40, strokeWidth: 3, radius: 17 }
            case "size-12":
                return { width: 48, height: 48, strokeWidth: 3, radius: 21 }
            default:
                return { width: 24, height: 24, strokeWidth: 2, radius: 10 }
        }
    }

    const { width, height, strokeWidth, radius } = getSizeValues()
    const circumference = 2 * Math.PI * radius
    const progress = calculateProgress()
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center", size)}>
                <Loader2 className={cn("animate-spin", size)} />
            </div>
        )
    }

    if (isError || !data?.progress) {
        return (
            <div className={cn("flex items-center justify-center", size)}>
                <div className={cn("rounded-full bg-gray-200 dark:bg-gray-700", size)} />
            </div>
        )
    }

    const completedCount = data.progress.habits.filter((h: HabitWithCompletion) => h.isCompleted).length
    const totalCount = data.progress.habits.length

    return (
        <div className={cn("relative flex items-center justify-center", size)} title={`${completedCount}/${totalCount} habits completed`}>
            <svg
                width={width}
                height={height}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={width / 2}
                    cy={height / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <circle
                    cx={width / 2}
                    cy={height / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={cn(
                        "transition-all duration-500 ease-in-out",
                        progress === 100 ? "text-green-500" : 
                        progress >= 75 ? "text-blue-500" : 
                        progress >= 50 ? "text-yellow-500" : 
                        progress >= 25 ? "text-orange-500" : 
                        "text-red-500"
                    )}
                />
            </svg>
            {/* Center text for larger sizes */}
            {(size === "size-10" || size === "size-12") && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {progress}%
                    </span>
                </div>
            )}
        </div>
    )
}
