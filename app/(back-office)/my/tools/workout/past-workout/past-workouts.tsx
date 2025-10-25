"use client"

import {useWorkouts} from "@/hooks/use-workouts"
import {PastWorkoutDisplay} from "./past-workout-display"
import {PastWorkoutsSkeleton} from "@/app/(back-office)/my/tools/workout/past-workout/past-workouts-skeleton";

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