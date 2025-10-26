"use client"

import {useSavedWorkouts} from "@/hooks/use-workouts"
import {SavedWorkoutDisplay} from "./saved-workout-display"
import {SavedWorkoutSkeleton} from "@/components/big/workout/saved-workout/saved-workout-skeleton";

export function SavedWorkouts() {
    const {savedWorkouts, isLoading} = useSavedWorkouts()

    if (isLoading) {
        return (
            <SavedWorkoutSkeleton/>
        )
    }

    if (savedWorkouts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center my-4 h-32 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">No saved workouts yet</h2>
                <p className="text-gray-600 dark:text-gray-400">Start by saving a workout as a template to see it here.</p>
            </div>
        )
    }

    return (
        <>
            {savedWorkouts.map((workout) => (
                <SavedWorkoutDisplay
                    key={workout.id}
                    workout={workout}
                />
            ))}
        </>
    )
}