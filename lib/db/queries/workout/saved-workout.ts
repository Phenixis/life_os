import * as lib from "../lib"

const savedWorkoutTable = lib.Schema.Workout.SavedWorkout.table
const setTable = lib.Schema.Workout.WorkoutSet.table
const exerciceTable = lib.Schema.Workout.Exercice.table
const setSavedWorkoutTable = lib.Schema.Workout.Set_SavedWorkout.table

type New = lib.Schema.Workout.SavedWorkout.Insert
type Existing = lib.Schema.Workout.SavedWorkout.Select

export type SavedWorkout = {
    id: number
    title: string
    exercices: {
        name: string,
        sets: {
            id: number
            weight: number,
            nb_rep: number,
        }[]
    }[]
}

// CREATE
export async function Create(userId: string, name: string): Promise<Existing> {
    return (await lib.db
        .insert(savedWorkoutTable)
        .values({
            name,
            user_id: userId,
        })
        .returning())[0]
}

// READ
export async function GetById(userId: string, id: number): Promise<Existing> {
    return (await lib.db
        .select()
        .from(savedWorkoutTable)
        .where(lib.and(
            lib.eq(savedWorkoutTable.user_id, userId),
            lib.eq(savedWorkoutTable.id, id),
            lib.isNull(savedWorkoutTable.deleted_at)
        )))[0];
}

export async function GetByUserId(userId: string, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(savedWorkoutTable)
        .where(lib.and(
            lib.eq(savedWorkoutTable.user_id, userId),
            lib.isNull(savedWorkoutTable.deleted_at)
        ))
        .orderBy(lib.desc(savedWorkoutTable.created_at))
        .limit(limit);
}

export async function getSavedWorkouts(userId: string): Promise<SavedWorkout[]> {
    const savedWorkouts = await GetByUserId(userId);
    
    const result: SavedWorkout[] = [];
    
    for (const workout of savedWorkouts) {
        // Get all set-to-saved-workout links for this workout
        const setLinks = await lib.db
            .select({
                set_id: setSavedWorkoutTable.set_id,
            })
            .from(setSavedWorkoutTable)
            .where(lib.and(
                lib.eq(setSavedWorkoutTable.saved_workout_id, workout.id),
                lib.isNull(setSavedWorkoutTable.deleted_at)
            ));
        
        const setIds = setLinks.map(link => link.set_id);
        
        if (setIds.length === 0) {
            result.push({
                id: workout.id,
                title: workout.name,
                exercices: []
            });
            continue;
        }
        
        // Get all sets with their exercises
        const setsWithExercises = await lib.db
            .select({
                set_id: setTable.id,
                weight: setTable.weight,
                nb_reps: setTable.nb_reps,
                exercice_id: setTable.exercice_id,
                exercice_name: exerciceTable.name,
            })
            .from(setTable)
            .leftJoin(exerciceTable, lib.eq(setTable.exercice_id, exerciceTable.id))
            .where(lib.and(
                lib.inArray(setTable.id, setIds),
                lib.isNull(setTable.deleted_at)
            ))
            .orderBy(lib.asc(setTable.id));
        
        // Group sets by exercise
        const exerciseMap = new Map<string, { name: string, sets: { id: number, weight: number, nb_rep: number }[] }>();
        
        for (const set of setsWithExercises) {
            const exerciseName = set.exercice_name || 'Unknown Exercise';
            
            if (!exerciseMap.has(exerciseName)) {
                exerciseMap.set(exerciseName, {
                    name: exerciseName,
                    sets: []
                });
            }
            
            exerciseMap.get(exerciseName)!.sets.push({
                id: set.set_id,
                weight: set.weight,
                nb_rep: set.nb_reps
            });
        }
        
        result.push({
            id: workout.id,
            title: workout.name,
            exercices: Array.from(exerciseMap.values())
        });
    }
    
    return result;
}

// UPDATE
export async function Update(id: number, values: Partial<New>): Promise<Existing> {
    return (await lib.db
        .update(savedWorkoutTable)
        .set({
            ...values,
            updated_at: new Date(),
        })
        .where(lib.eq(savedWorkoutTable.id, id))
        .returning())[0];
}

// DELETE
export async function Delete(id: number): Promise<void> {
    await lib.db
        .update(savedWorkoutTable)
        .set({
            deleted_at: new Date(),
        })
        .where(lib.eq(savedWorkoutTable.id, id));
}