"use server"

import * as lib from "./lib"

//=============================================================================
// # Workout
//=============================================================================

// ## Create

export async function createWorkout(
    userId: string,
    dateOrWorkout: Date | lib.Schema.Workout.Workout.Insert,
    note?: number,
    comment?: string,
    seance_id?: number,
) {
    let newWorkout: lib.Schema.Workout.Workout.Insert

    if (dateOrWorkout instanceof Date) {
        newWorkout = {
            date: dateOrWorkout,
            note: note,
            comment: comment,
            seance_id: seance_id,
            user_id: userId,
        }
    } else {
        newWorkout = dateOrWorkout
    }

    const result = await lib.db.insert(lib.Schema.Workout.Workout.table).values(newWorkout).returning({ id: lib.Schema.Workout.Workout.table.id })

    // Revalidate all pages that might show workouts
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getWorkoutById(userId: string, id: number) {
    return (await lib.db.select().from(lib.Schema.Workout.Workout.table).where(lib.and(
        lib.eq(lib.Schema.Workout.Workout.table.id, id),
        lib.eq(lib.Schema.Workout.Workout.table.user_id, userId),
    ))) as lib.Schema.Workout.Workout.Select[]
}

export async function getAllWorkouts(userId: string) {
    return (await lib.db
        .select()
        .from(lib.Schema.Workout.Workout.table)
        .where(lib.and(
            lib.isNull(lib.Schema.Workout.Workout.table.deleted_at),
            lib.eq(lib.Schema.Workout.Workout.table.user_id, userId),
        ))
        .orderBy(lib.desc(lib.Schema.Workout.Workout.table.date))) as lib.Schema.Workout.Workout.Select[]
}

export async function getRecentWorkouts(userId: string, limit = 5) {
    return (await lib.db
        .select()
        .from(lib.Schema.Workout.Workout.table)
        .where(lib.and(
            lib.isNull(lib.Schema.Workout.Workout.table.deleted_at),
            lib.eq(lib.Schema.Workout.Workout.table.user_id, userId),
        ))
        .orderBy(lib.desc(lib.Schema.Workout.Workout.table.date))
        .limit(limit)) as lib.Schema.Workout.Workout.Select[]
}

export async function getWorkoutsBySeanceId(userId: string, seance_id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Workout.Workout.table)
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Workout.table.seance_id, seance_id),
            lib.eq(lib.Schema.Workout.Workout.table.user_id, userId),
            lib.isNull(lib.Schema.Workout.Workout.table.deleted_at),
        ))
        .orderBy(lib.desc(lib.Schema.Workout.Workout.table.date))) as lib.Schema.Workout.Workout.Select[]
}

// ## Update

export async function updateWorkout(
    userId: string,
    idOrWorkout: number | lib.Schema.Workout.Workout.Insert,
    date?: Date,
    note?: number,
    comment?: string,
    seance_id?: number,
) {
    let updatedWorkout: Partial<lib.Schema.Workout.Workout.Insert>

    if (typeof idOrWorkout === "number") {
        updatedWorkout = {
            date: date,
            note: note,
            comment: comment,
            seance_id: seance_id,
            updated_at: new Date(),
            user_id: userId,
        }
    } else {
        updatedWorkout = {
            ...idOrWorkout,
            updated_at: new Date(),
        }
    }

    const result = await lib.db
        .update(lib.Schema.Workout.Workout.table)
        .set(updatedWorkout)
        .where(lib.eq(lib.Schema.Workout.Workout.table.id, typeof idOrWorkout === "number" ? idOrWorkout : idOrWorkout.id!))
        .returning({ id: lib.Schema.Workout.Workout.table.id })

    // Revalidate all pages that might show workouts
    lib.revalidatePath("/my", "layout")

    if (!result) {
        return null
    }

    return result[0].id
}

// ## Delete

export async function deleteWorkoutById(userId: string, id: number) {
    const result = await lib.db
        .update(lib.Schema.Workout.Workout.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Workout.table.id, id),
            lib.eq(lib.Schema.Workout.Workout.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Workout.Workout.table.id })

    // Revalidate all pages that might show workouts
    lib.revalidatePath("/my", "layout")

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}