import {getSavedWorkouts} from "@/lib/db/queries/workout/saved-workout";
import {SavedWorkoutDisplay} from "./saved-workout-display"

export async function SavedWorkouts() {
    const savedWorkouts = await getSavedWorkouts()

    return (
        savedWorkouts.map((workout, index) => (
            <SavedWorkoutDisplay key={index}
                                 workout={workout}
            />
        ))
    )
}