import {SavedWorkoutDisplay} from "@/app/(back-office)/my/tools/workout/saved-workout/saved-workout-display";

export function SavedWorkoutSkeleton(
    {
        nb = 3
    }: {
        nb?: number;
    }
) {
    return (
        Array.from({ length: nb }).map((_, index) => (
            <SavedWorkoutDisplay key={index} />
        ))
    )
}