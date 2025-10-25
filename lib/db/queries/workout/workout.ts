import * as lib from "../lib"

const table = lib.Schema.Workout.Workout.table
type New = lib.Schema.Workout.Workout.Insert
type Existing = lib.Schema.Workout.Workout.Select

// CREATE

export async function Create(values: New): Promise<Existing> {
    return (await lib.db
        .insert(table)
        .values(values)
        .returning())[0]
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

export async function GetByName(user_id: string, name: string): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.eq(table.name, name)
        ));
}

export async function getBeforeDate(user_id: string, end: Date, deleted?: boolean, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.lte(table.date, end),
            deleted === undefined ? undefined :
                deleted ? lib.isNotNull(table.deleted_at) :
                    lib.isNull(table.deleted_at)
        ))
        .limit(limit);
}

export async function getAfterDate(user_id: string, start: Date, deleted?: boolean, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.gte(table.date, start),
            deleted === undefined ? undefined :
                deleted ? lib.isNotNull(table.deleted_at) :
                    lib.isNull(table.deleted_at)
        ))
        .limit(limit);
}

export async function GetByStartAndEndDate(user_id: string, start: Date, end: Date, deleted?: boolean, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.gte(table.date, start),
            lib.lte(table.date, end),
            deleted === undefined ? undefined :
                deleted ? lib.isNotNull(table.deleted_at) :
                    lib.isNull(table.deleted_at)
        ))
        .limit(limit);
}

export async function getByDifficulty(user_id: string, difficulty: 1 | 2 | 3 | 4 | 5, deleted?: boolean, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, user_id),
            lib.eq(table.difficulty, difficulty),
            deleted === undefined ? undefined : deleted ? lib.isNotNull(table.deleted_at) :
                lib.isNull(table.deleted_at)
        ))
        .limit(limit);
}

// UPDATE

export async function Update(id: number, values: Partial<New>): Promise<Existing> {
    return (await lib.db
        .update(table)
        .set(values)
        .where(lib.eq(table.id, id))
        .returning())[0];
}

// DELETE

export async function Delete(id: number): Promise<void> {
    await lib.db
        .update(table)
        .set({
            deleted_at: new Date(),
        })
        .where(lib.eq(table.id, id));

    return;
}