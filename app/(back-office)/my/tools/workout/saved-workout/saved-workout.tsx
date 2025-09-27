import {Suspense} from "react";
import {SavedWorkouts} from "./saved-workout-async";
import {SavedWorkoutSkeleton} from "./saved-workout-skeleton";

export function SavedWorkout() {
    return (
        <Suspense fallback={<SavedWorkoutSkeleton/>}>
            <SavedWorkouts/>
        </Suspense>
    )
}