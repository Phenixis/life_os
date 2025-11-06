import * as lib from "../lib"

const setTable = lib.Schema.Workout.WorkoutSet.table
const exerciceTable = lib.Schema.Workout.Exercice.table

export type PersonalRecord = {
    exercice_name: string
    weight: number
    nb_reps: number
    date: Date
}

/**
 * Get personal records for a user - the best set (by weight) for each exercise
 * Sorted by weight from heaviest to lightest
 */
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    // Get all sets with their exercises, excluding deleted ones
    const allSets = await lib.db
        .select({
            exercice_name: exerciceTable.name,
            weight: setTable.weight,
            nb_reps: setTable.nb_reps,
            created_at: setTable.created_at,
        })
        .from(setTable)
        .innerJoin(exerciceTable, lib.eq(setTable.exercice_id, exerciceTable.id))
        .where(lib.and(
            lib.eq(setTable.user_id, userId),
            lib.isNull(setTable.deleted_at),
            lib.isNull(exerciceTable.deleted_at)
        ))
        .orderBy(lib.desc(setTable.weight), lib.desc(setTable.nb_reps), lib.desc(exerciceTable.name));

    // Group by exercise and keep only the best set (highest weight) for each
    const recordsMap = new Map<string, PersonalRecord>();

    for (const set of allSets) {
        const exerciseName = set.exercice_name;
        
        if (!recordsMap.has(exerciseName)) {
            recordsMap.set(exerciseName, {
                exercice_name: exerciseName,
                weight: set.weight,
                nb_reps: set.nb_reps,
                date: set.created_at,
            });
        }
    }

    // Convert to array and sort by weight (descending)
    return Array.from(recordsMap.values())
        .sort((a, b) => b.weight - a.weight);
}
