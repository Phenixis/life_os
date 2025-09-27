"use server"

import * as lib from "./lib"

//=============================================================================
// # Exercice
//=============================================================================

// ## Create

export async function createExercice(userId: string, nameOrExercice: string | lib.Schema.Workout.Exercice.Insert) {
    let newExercice: lib.Schema.Workout.Exercice.Insert

    if (typeof nameOrExercice === "string") {
        newExercice = {
            name: nameOrExercice,
            user_id: userId,
        }
    } else {
        newExercice = nameOrExercice
    }

    const result = await lib.db.insert(lib.Schema.Workout.Exercice.table).values(newExercice).returning({ id: lib.Schema.Workout.Exercice.table.id })

    // Revalidate all pages that might show exercices
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getExerciceById(userId: string, id: number) {
    return (await lib.db.select().from(lib.Schema.Workout.Exercice.table).where(lib.and(
        lib.eq(lib.Schema.Workout.Exercice.table.id, id),
        lib.eq(lib.Schema.Workout.Exercice.table.user_id, userId),
    ))) as lib.Schema.Workout.Exercice.Select[]
}

export async function getExercices(userId: string) {
    return (await lib.db.select().from(lib.Schema.Workout.Exercice.table).where(lib.and(
        lib.isNull(lib.Schema.Workout.Exercice.table.deleted_at),
        lib.eq(lib.Schema.Workout.Exercice.table.user_id, userId),
    ))) as lib.Schema.Workout.Exercice.Select[]
}

// ## Update

export async function updateExercice(userId: string, idOrExercice: number | lib.Schema.Workout.Exercice.Insert, name?: string) {
    let updatedExercice: Partial<lib.Schema.Workout.Exercice.Insert>

    if (typeof idOrExercice === "number") {
        updatedExercice = {
            name: name!,
            updated_at: new Date(),
        }
    } else {
        updatedExercice = {
            ...idOrExercice,
            updated_at: new Date(),
        }
    }

    const result = await lib.db
        .update(lib.Schema.Workout.Exercice.table)
        .set(updatedExercice)
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Exercice.table.id, typeof idOrExercice === "number" ? idOrExercice : idOrExercice.id!),
            lib.eq(lib.Schema.Workout.Exercice.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Workout.Exercice.table.id })

    // Revalidate all pages that might show exercices
    lib.revalidatePath("/my", "layout")

    if (!result) {
        return null
    }

    return result[0].id
}

// ## Delete

export async function deleteExerciceById(userId: string, id: number) {
    const result = await lib.db
        .update(lib.Schema.Workout.Exercice.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Exercice.table.id, id),
            lib.eq(lib.Schema.Workout.Exercice.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Workout.Exercice.table.id })

    // Revalidate all pages that might show exercices
    lib.revalidatePath("/my", "layout")

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}