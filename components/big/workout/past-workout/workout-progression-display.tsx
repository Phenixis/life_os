"use client"

import {useWorkoutProgression} from "@/hooks/use-workouts"
import {formatProgressionText} from "@/lib/utils/workout-progression"
import {Loader2, Minus, TrendingDown, TrendingUp} from "lucide-react"
import type {ExerciseProgression} from "@/lib/types/workout"

interface WorkoutProgressionDisplayProps {
    workoutId: number
}

function ProgressionBadge({progression}: { progression: ExerciseProgression }) {
    if (!progression.progression) {
        return (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Minus className="size-3"/>
                <span>New exercise</span>
            </div>
        )
    }

    const {weightDiff, repsDiff} = progression.progression
    const changeMetric = weightDiff !== 0 ? weightDiff : repsDiff
    const isPositive = changeMetric > 0
    const isNeutral = weightDiff === 0 && repsDiff === 0

    if (isNeutral) {
        return (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Minus className="size-3"/>
                <span>No change</span>
            </div>
        )
    }

    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400"

    return (
        <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
            <Icon className="size-3"/>
            <span>{formatProgressionText(progression)}</span>
        </div>
    )
}

export function WorkoutProgressionDisplay({workoutId}: WorkoutProgressionDisplayProps) {
    const {progression, isLoading, error} = useWorkoutProgression(workoutId)

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-2">
                <Loader2 className="size-4 animate-spin"/>
                <span>Analyzing progression...</span>
            </div>
        )
    }

    if (error || !progression) {
        return null
    }

    // Filter to only show exercises with progression data
    const exercisesWithProgression = progression.exercises.filter(
        ex => ex.progression !== null || ex.previousBestSet === null
    )

    if (exercisesWithProgression.length === 0) {
        return null
    }

    return (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Progression vs. Previous Workout
            </h4>
            <div className="space-y-1.5">
                {exercisesWithProgression.map((exercise) => (
                    <div
                        key={exercise.exerciseName}
                        className="flex justify-between items-center gap-2"
                    >
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {exercise.exerciseName}
                        </span>
                        <ProgressionBadge progression={exercise}/>
                    </div>
                ))}
            </div>
        </div>
    )
}