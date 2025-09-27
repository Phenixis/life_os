"use server"

import * as lib from "./lib"

//=============================================================================
// # Serie
//=============================================================================

// ## Create

export async function createSerie(
    userId: string,
    seriesGroupIdOrSerie: number | lib.Schema.Workout.Serie.Insert,
    exercice_id?: number,
    poids?: number,
    reps?: number,
    exercice_position?: number,
    serie_position?: number,
) {
    let newSerie: lib.Schema.Workout.Serie.Insert

    if (typeof seriesGroupIdOrSerie === "number") {
        newSerie = {
            series_group_id: seriesGroupIdOrSerie,
            exercice_id: exercice_id!,
            poids: poids,
            reps: reps,
            exercice_position: exercice_position!,
            serie_position: serie_position!,
            user_id: userId,
        }
    } else {
        newSerie = seriesGroupIdOrSerie
    }

    const result = await lib.db.insert(lib.Schema.Workout.Serie.table).values(newSerie).returning({ id: lib.Schema.Workout.Serie.table.id })

    // Revalidate all pages that might show series
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getSerieById(userId: string, id: number) {
    return (await lib.db.select().from(lib.Schema.Workout.Serie.table).where(lib.and(
        lib.eq(lib.Schema.Workout.Serie.table.id, id),
        lib.eq(lib.Schema.Workout.Serie.table.user_id, userId),
    ))) as lib.Schema.Workout.Serie.Select[]
}


export async function getSeriesByExerciceId(userId: string, exercice_id: number) {
    return (
        await lib.db
            .select()
            .from(lib.Schema.Workout.Serie.table)
            .where(lib.and(
                lib.eq(lib.Schema.Workout.Serie.table.exercice_id, exercice_id),
                lib.eq(lib.Schema.Workout.Serie.table.user_id, userId),
                lib.isNull(lib.Schema.Workout.Serie.table.deleted_at),
            ))
            .orderBy(lib.asc(lib.Schema.Workout.Serie.table.exercice_position), lib.asc(lib.Schema.Workout.Serie.table.serie_position))
    )
}

export async function getSeries(userId: string) {
    return (await lib.db.select().from(lib.Schema.Workout.Serie.table).where(lib.and(
        lib.isNull(lib.Schema.Workout.Serie.table.deleted_at),
        lib.eq(lib.Schema.Workout.Serie.table.user_id, userId),
    ))) as lib.Schema.Workout.Serie.Select[]
}

export async function getSeriesByExerciceIds(userId: string, exercice_ids: number[]) {
    return (
        await lib.db
            .select()
            .from(lib.Schema.Workout.Serie.table)
            .where(lib.and(
                lib.inArray(lib.Schema.Workout.Serie.table.exercice_id, exercice_ids),
                lib.isNull(lib.Schema.Workout.Serie.table.deleted_at)
            ))
            .orderBy(lib.asc(lib.Schema.Workout.Serie.table.exercice_position), lib.asc(lib.Schema.Workout.Serie.table.serie_position))
    )
}

// ## Update

export async function updateSerie(
    userId: string,
    idOrSerie: number | lib.Schema.Workout.Serie.Insert,
    series_group_id?: number,
    exercice_id?: number,
    poids?: number,
    reps?: number,
    exercice_position?: number,
    serie_position?: number,
) {
    let updatedSerie: Partial<lib.Schema.Workout.Serie.Insert>

    if (typeof idOrSerie === "number") {
        updatedSerie = {
            series_group_id: series_group_id,
            exercice_id: exercice_id,
            poids: poids,
            reps: reps,
            exercice_position: exercice_position,
            serie_position: serie_position,
            updated_at: new Date(),
            user_id: userId,
        }
    } else {
        updatedSerie = {
            ...idOrSerie,
            updated_at: new Date(),
        }
    }

    const result = await lib.db
        .update(lib.Schema.Workout.Serie.table)
        .set(updatedSerie)
        .where(lib.eq(lib.Schema.Workout.Serie.table.id, typeof idOrSerie === "number" ? idOrSerie : idOrSerie.id!))
        .returning({ id: lib.Schema.Workout.Serie.table.id })

    // Revalidate all pages that might show series
    lib.revalidatePath("/my", "layout")

    if (!result) {
        return null
    }

    return result[0].id
}

// ## Delete

export async function deleteSerieById(userId: string, id: number) {
    const result = await lib.db
        .update(lib.Schema.Workout.Serie.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(lib.Schema.Workout.Serie.table.id, id),
            lib.eq(lib.Schema.Workout.Serie.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Workout.Serie.table.id })

    // Revalidate all pages that might show series
    lib.revalidatePath("/my", "layout")

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}