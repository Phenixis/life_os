import {SavedWorkoutDisplay} from "@/components/big/workout/saved-workout/saved-workout-display";

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