import {SavedWorkoutDisplay} from "@/app/(back-office)/my/tools/workout/saved-workout/saved-workout-display";

export function PastWorkoutsSkeleton(
    {
        nb = 3
    }: {
        nb?: number;
    }
) {
    return (
        Array.from({length: nb}).map((_, index) => (
            <SavedWorkoutDisplay key={index}/>
        ))
    )
}