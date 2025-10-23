"use client"

import { useWorkouts } from "@/hooks/use-workouts"
import { PastWorkoutDisplay } from "./past-workout-display"

export function PastWorkoutsAsync() {
    const { workouts, isLoading } = useWorkouts()

    if (isLoading) {
        return (
            <>
                <PastWorkoutDisplay />
                <PastWorkoutDisplay />
                <PastWorkoutDisplay />
            </>
        )
    }

    return (
        <>
            {workouts.map((workout) => (
                <PastWorkoutDisplay 
                    key={workout.id}
                    workout={workout}
                />
            ))}
        </>
    )
}