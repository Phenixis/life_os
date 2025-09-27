import {Suspense} from "react";
import {PastWorkoutsAsync} from "./past-workouts-async";
import {PastWorkoutsSkeleton} from "./past-workouts-skeleton";

export function PastWorkouts() {
    return (
        <Suspense fallback={<PastWorkoutsSkeleton/>}>
            <PastWorkoutsAsync/>
        </Suspense>
    )
}