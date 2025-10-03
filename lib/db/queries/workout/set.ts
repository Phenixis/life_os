import * as lib from "../lib"

const table = lib.Schema.Workout.WorkoutSet.table
type New = lib.Schema.Workout.WorkoutSet.Insert
type Existing = lib.Schema.Workout.WorkoutSet.Select

// CREATE

export async function Create(values: New): Promise<Existing> {
    return (await lib.db
        .insert(table)
        .values(values)
        .returning())[0];
}

// READ

export async function GetById(user_id: string, id: number): Promise<Existing> {
    return (await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.eq(table.id, id),
        )))[0];
}

export async function GetByUserId(user_id: string, deleted?: boolean, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            deleted === undefined ? undefined :
                deleted ? lib.isNotNull(table.deleted_at) :
                    lib.isNull(table.deleted_at)
        ))
        .limit(limit);
}

export async function GetByExerciceId(user_id: string, exercice_id: number): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.eq(table.exercice_id, exercice_id)
        ));
}

// UPDATE

export async function Update(id: number, values: Partial<New>): Promise<Existing> {
    return (await lib.db
        .update(table)
        .set(values)
        .where(lib.eq(table.id, id))
        .returning())[0]
}

// DELETE

export async function Delete(id: number): Promise<void> {
    await lib.db
        .update(table)
        .set({
            deleted_at: new Date(),
        })
        .where(lib.eq(table.id, id));
}