"use client"

import {useSavedWorkouts} from "@/hooks/use-workouts"
import {SavedWorkoutDisplay} from "./saved-workout-display"
import {SavedWorkoutSkeleton} from "@/components/big/workout/saved-workout/saved-workout-skeleton";

export function SavedWorkoutsAsync() {
    const {savedWorkouts, isLoading} = useSavedWorkouts()

    if (isLoading) {
        return (
            <SavedWorkoutSkeleton/>
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