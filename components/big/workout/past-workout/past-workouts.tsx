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