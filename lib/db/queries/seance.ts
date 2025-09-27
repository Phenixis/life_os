"use server"

import * as lib from "./lib"

//=============================================================================
// # Seance
//=============================================================================

// ## Create

export async function createSeance(userId: string, nameOrSeance: string | lib.Schema.Workout.Seance.Insert) {
    let newSeance: lib.Schema.Workout.Seance.Insert

    if (typeof nameOrSeance === "string") {
        newSeance = {
            name: nameOrSeance,
            user_id: userId,
        }
    } else {
        newSeance = nameOrSeance
    }

    const result = await lib.db.insert(lib.Schema.Workout.Seance.table).values(newSeance).returning({ id: lib.Schema.Workout.Seance.table.id })

    // Revalidate all pages that might show seances
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getSeanceById(userId: string, id: number) {
    return (await lib.db.select().from(lib.Schema.Workout.Seance.table).where(lib.and(
        lib.eq(lib.Schema.Workout.Seance.table.id, id),
        lib.eq(lib.Schema.Workout.Seance.table.user_id, userId),
    ))) as lib.Schema.Workout.Seance.Select[]
}

export async function getSeances(userId: string) {
    return (await lib.db.select().from(lib.Schema.Workout.Seance.table).where(lib.and(
        lib.isNull(lib.Schema.Workout.Seance.table.deleted_at),
        lib.eq(lib.Schema.Workout.Seance.table.user_id, userId),
    ))) as lib.Schema.Workout.Seance.Select[]
}

// ## Update

export async function updateSeance(userId: string, idOrSeance: number | lib.Schema.Workout.Seance.Insert, name?: string) {
    let updatedSeance: Partial<lib.Schema.Workout.Seance.Insert>

    if (typeof idOrSeance === "number") {
        updatedSeance = {
            name: name!,
            updated_at: new Date(),
        }
    } else {
        updatedSeance = {
            ...idOrSeance,
            updated_at: new Date(),
        }
    }

    const result = await lib.db
        .update(lib.Schema.Workout.Seance.table)
        .set(updatedSeance)
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Seance.table.id, typeof idOrSeance === "number" ? idOrSeance : idOrSeance.id!),
            lib.eq(lib.Schema.Workout.Seance.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Workout.Seance.table.id })

    // Revalidate all pages that might show seances
    lib.revalidatePath("/my", "layout")

    if (!result) {
        return null
    }

    return result[0].id
}

// ## Delete

export async function deleteSeanceById(userId: string, id: number) {
    const result = await lib.db
        .update(lib.Schema.Workout.Seance.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Seance.table.id, id),
            lib.eq(lib.Schema.Workout.Seance.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Workout.Seance.table.id })

    // Revalidate all pages that might show seances
    lib.revalidatePath("/my", "layout")

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}