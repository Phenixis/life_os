import {getPastWorkouts} from "@/lib/db/queries/workout/past-workout";
import {PastWorkoutDisplay} from "./past-workout-display"

export async function PastWorkoutsAsync() {
    const savedWorkouts = await getPastWorkouts()

    return (
        savedWorkouts.sort(
            (a, b) => a.date < b.date ? 1 : -1
        ).map((workout, index) => (
            <PastWorkoutDisplay key={index}
                                workout={workout}
            />
        ))
    )
}