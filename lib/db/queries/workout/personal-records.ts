import * as lib from "../lib"

const setTable = lib.Schema.Workout.WorkoutSet.table
const exerciceTable = lib.Schema.Workout.Exercice.table

export type PersonalRecord = {
    exercice_name: string
    weight: number
    nb_reps: number
    date: Date
    previous_weight: number | null
    previous_nb_reps: number | null
    weight_diff: number | null
    nb_reps_diff: number | null
    progress_metric: 'weight' | 'reps' | null
}

/**
 * Get personal records for a user - the best set (by weight) for each exercise
 * Sorted by weight from heaviest to lightest
 * Also includes the previous best weight and the difference
 */
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    // Get all sets with their exercises, excluding deleted ones
    const allSets = await lib.db
        .selectDistinctOn([setTable.weight, setTable.nb_reps], {
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
        .orderBy(lib.desc(setTable.weight), lib.desc(setTable.nb_reps), lib.desc(exerciceTable.name))
        .groupBy(exerciceTable.name, setTable.weight, setTable.nb_reps, setTable.created_at);


    // Group by exercise and keep the best two sets (highest weight) for each
    const exerciseSetsMap = new Map<string, typeof allSets>();

    for (const set of allSets) {
        const exerciseName = set.exercice_name;
        
        if (!exerciseSetsMap.has(exerciseName)) {
            exerciseSetsMap.set(exerciseName, []);
        }
        
        const sets = exerciseSetsMap.get(exerciseName)!;
        if (sets.length < 2) {
            sets.push(set);
        }
    }

    // Build personal records with previous weight comparison
    const records: PersonalRecord[] = [];

    for (const [exerciseName, sets] of exerciseSetsMap.entries()) {
        const bestSet = sets[0];
        const secondBestSet = sets.length > 1 ? sets[1] : null;
        
        const previous_weight = secondBestSet ? secondBestSet.weight : null;
        const previous_nb_reps = secondBestSet ? secondBestSet.nb_reps : null;
        const weight_diff = previous_weight !== null ? bestSet.weight - previous_weight : null;
        // Mirror progression logic: only compare reps when the heaviest weight is unchanged
        const nb_reps_diff = previous_nb_reps !== null && weight_diff === 0
            ? bestSet.nb_reps - previous_nb_reps
            : null;

        let progress_metric: 'weight' | 'reps' | null = null;
        if (previous_weight !== null) {
            if (weight_diff !== null && weight_diff !== 0) {
                progress_metric = 'weight';
            } else if (nb_reps_diff !== null && nb_reps_diff !== 0) {
                progress_metric = 'reps';
            }
        }

        records.push({
            exercice_name: exerciseName,
            weight: bestSet.weight,
            nb_reps: bestSet.nb_reps,
            date: bestSet.created_at,
            previous_weight,
            previous_nb_reps,
            weight_diff,
            nb_reps_diff,
            progress_metric,
        });
    }

    // Sort by weight (descending)
    return records.sort((a, b) => b.weight - a.weight);
}
