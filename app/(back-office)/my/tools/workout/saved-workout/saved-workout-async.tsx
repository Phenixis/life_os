"use client"

import { useSavedWorkouts } from "@/hooks/use-workouts"
import { SavedWorkoutDisplay } from "./saved-workout-display"

export function SavedWorkouts() {
    const { savedWorkouts, isLoading } = useSavedWorkouts()

    if (isLoading) {
        return (
            <>
                <SavedWorkoutDisplay />
                <SavedWorkoutDisplay />
            </>
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