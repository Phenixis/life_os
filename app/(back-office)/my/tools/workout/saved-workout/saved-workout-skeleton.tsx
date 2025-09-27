import {SavedWorkoutDisplay} from "@/app/(back-office)/my/tools/workout/saved-workout/saved-workout-display";

export function SavedWorkoutSkeleton() {
    return (
        Array.from({ length: 3 }).map((_, index) => (
            <SavedWorkoutDisplay key={index} />
        ))
    )
}