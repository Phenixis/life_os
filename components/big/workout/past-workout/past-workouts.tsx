"use client"

import {useWorkouts} from "@/hooks/use-workouts"
import {PastWorkoutDisplay} from "./past-workout-display"
import {PastWorkoutsSkeleton} from "@/components/big/workout/past-workout/past-workouts-skeleton";

export function PastWorkouts() {
    const {workouts, isLoading} = useWorkouts()

    if (isLoading) {
        return (
            <PastWorkoutsSkeleton nb={5}/>
        )
    }

    if (workouts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center my-4 h-32 bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
                <h2 className="text-2xl font-bold mb-4">No past workouts yet</h2>
                <p className="text-gray-600 dark:text-gray-400">Start by creating a workout to see it here.</p>
            </div>
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