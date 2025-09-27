"use server"

import * as lib from "./lib"

//=============================================================================
// # SeanceExercice
//=============================================================================

// ## Create

export async function createSeanceExercice(
    seanceIdOrSeanceExercice: number | lib.Schema.Workout.SeanceExercice.Insert,
    exercice_id?: number,
    position?: number,
    nb_series?: number,
) {
    let newSeanceExercice: lib.Schema.Workout.SeanceExercice.Insert

    if (typeof seanceIdOrSeanceExercice === "number") {
        newSeanceExercice = {
            seance_id: seanceIdOrSeanceExercice,
            exercice_id: exercice_id!,
            position: position!,
            nb_series: nb_series!,
        }
    } else {
        newSeanceExercice = seanceIdOrSeanceExercice
    }

    const result = await lib.db
        .insert(lib.Schema.Workout.SeanceExercice.table)
        .values(newSeanceExercice)
        .returning({ id: lib.Schema.Workout.SeanceExercice.table.id })

    // Revalidate all pages that might show seance exercices
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getSeanceExerciceById(id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Workout.SeanceExercice.table)
        .where(lib.eq(lib.Schema.Workout.SeanceExercice.table.id, id))) as lib.Schema.Workout.SeanceExercice.Select[]
}

export async function getSeanceExercicesBySeanceId(seance_id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Workout.SeanceExercice.table)
        .where(lib.and(lib.eq(lib.Schema.Workout.SeanceExercice.table.seance_id, seance_id), lib.isNull(lib.Schema.Workout.SeanceExercice.table.deleted_at)))
        .orderBy(lib.asc(lib.Schema.Workout.SeanceExercice.table.position))) as lib.Schema.Workout.SeanceExercice.Select[]
}

export async function getSeanceExercices() {
    return (await lib.db
        .select()
        .from(lib.Schema.Workout.SeanceExercice.table)
        .where(lib.isNull(lib.Schema.Workout.SeanceExercice.table.deleted_at))) as lib.Schema.Workout.SeanceExercice.Select[]
}

// ## Update

export async function updateSeanceExercice(
    idOrSeanceExercice: number | lib.Schema.Workout.SeanceExercice.Insert,
    seance_id?: number,
    exercice_id?: number,
    position?: number,
    nb_series?: number,
) {
    let updatedSeanceExercice: Partial<lib.Schema.Workout.SeanceExercice.Insert>

    if (typeof idOrSeanceExercice === "number") {
        updatedSeanceExercice = {
            seance_id: seance_id,
            exercice_id: exercice_id,
            position: position,
            nb_series: nb_series,
            updated_at: new Date(),
        }
    } else {
        updatedSeanceExercice = {
            ...idOrSeanceExercice,
            updated_at: new Date(),
        }
    }

    const result = await lib.db
        .update(lib.Schema.Workout.SeanceExercice.table)
        .set(updatedSeanceExercice)
        .where(
            lib.eq(
                lib.Schema.Workout.SeanceExercice.table.id,
                typeof idOrSeanceExercice === "number" ? idOrSeanceExercice : idOrSeanceExercice.id!,
            ),
        )
        .returning({ id: lib.Schema.Workout.SeanceExercice.table.id })

    // Revalidate all pages that might show seance exercices
    lib.revalidatePath("/my", "layout")

    if (!result) {
        return null
    }

    return result[0].id
}

// ## Delete

export async function deleteSeanceExerciceById(id: number) {
    const result = await lib.db
        .update(lib.Schema.Workout.SeanceExercice.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.eq(lib.Schema.Workout.SeanceExercice.table.id, id))
        .returning({ id: lib.Schema.Workout.SeanceExercice.table.id })

    // Revalidate all pages that might show seance exercices
    lib.revalidatePath("/my", "layout")

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}