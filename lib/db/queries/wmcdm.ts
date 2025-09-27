"use server"

import * as lib from "./lib"

export type WmcdmMatrixWithRelations = lib.Schema.WMCDM.Matrix.Select & {
    criteria: (lib.Schema.WMCDM.Criterion.Select & {
        scores: lib.Schema.WMCDM.Score.Select[]
    })[]
    options: (lib.Schema.WMCDM.Option.Select & {
        scores: lib.Schema.WMCDM.Score.Select[]
    })[]
}

// ## Matrix Operations

export async function createWmcdmMatrix(
    userId: string,
    name: string,
    description?: string
): Promise<number> {
    const result = await lib.db
        .insert(lib.Schema.WMCDM.Matrix.table)
        .values({
            user_id: userId,
            name: name,
            description: description,
        })
        .returning({ id: lib.Schema.WMCDM.Matrix.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result[0].id
}

export async function getWmcdmMatrices(userId: string): Promise<lib.Schema.WMCDM.Matrix.Select[]> {
    return await lib.db
        .select()
        .from(lib.Schema.WMCDM.Matrix.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Matrix.table.user_id, userId),
            lib.isNull(lib.Schema.WMCDM.Matrix.table.deleted_at)
        ))
        .orderBy(lib.desc(lib.Schema.WMCDM.Matrix.table.updated_at))
}

export async function getWmcdmMatrixById(
    userId: string,
    matrixId: number
): Promise<WmcdmMatrixWithRelations | null> {
    // Get the matrix
    const matrix = await lib.db
        .select()
        .from(lib.Schema.WMCDM.Matrix.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Matrix.table.id, matrixId),
            lib.eq(lib.Schema.WMCDM.Matrix.table.user_id, userId),
            lib.isNull(lib.Schema.WMCDM.Matrix.table.deleted_at)
        ))
        .limit(1)

    if (!matrix || matrix.length === 0) {
        return null
    }

    // Get criteria
    const criteria = await lib.db
        .select()
        .from(lib.Schema.WMCDM.Criterion.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Criterion.table.matrix_id, matrixId),
            lib.isNull(lib.Schema.WMCDM.Criterion.table.deleted_at)
        ))
        .orderBy(lib.asc(lib.Schema.WMCDM.Criterion.table.position))

    // Get options
    const options = await lib.db
        .select()
        .from(lib.Schema.WMCDM.Option.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Option.table.matrix_id, matrixId),
            lib.isNull(lib.Schema.WMCDM.Option.table.deleted_at)
        ))
        .orderBy(lib.asc(lib.Schema.WMCDM.Option.table.position))

    // Get scores
    const scores = await lib.db
        .select()
        .from(lib.Schema.WMCDM.Score.table)
        .where(lib.eq(lib.Schema.WMCDM.Score.table.matrix_id, matrixId))

    // Group scores by criterion and option
    const criteriaWithScores = criteria.map(criterion => ({
        ...criterion,
        scores: scores.filter(score => score.criterion_id === criterion.id)
    }))

    const optionsWithScores = options.map(option => ({
        ...option,
        scores: scores.filter(score => score.option_id === option.id)
    }))

    return {
        ...matrix[0],
        criteria: criteriaWithScores,
        options: optionsWithScores
    }
}

export async function updateWmcdmMatrix(
    userId: string,
    matrixId: number,
    name: string,
    description?: string
): Promise<boolean> {
    const result = await lib.db
        .update(lib.Schema.WMCDM.Matrix.table)
        .set({
            name: name,
            description: description,
            updated_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Matrix.table.id, matrixId),
            lib.eq(lib.Schema.WMCDM.Matrix.table.user_id, userId),
            lib.isNull(lib.Schema.WMCDM.Matrix.table.deleted_at)
        ))
        .returning({ id: lib.Schema.WMCDM.Matrix.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result.length > 0
}

export async function deleteWmcdmMatrix(
    userId: string,
    matrixId: number
): Promise<boolean> {
    const result = await lib.db
        .update(lib.Schema.WMCDM.Matrix.table)
        .set({
            deleted_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Matrix.table.id, matrixId),
            lib.eq(lib.Schema.WMCDM.Matrix.table.user_id, userId),
            lib.isNull(lib.Schema.WMCDM.Matrix.table.deleted_at)
        ))
        .returning({ id: lib.Schema.WMCDM.Matrix.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result.length > 0
}

// ## Criterion Operations

export async function createWmcdmCriterion(
    matrixId: number,
    name: string,
    weight: number,
    description?: string
): Promise<number> {
    // Get the next position
    const maxPosition = await lib.db
        .select({ max: lib.Schema.WMCDM.Criterion.table.position })
        .from(lib.Schema.WMCDM.Criterion.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Criterion.table.matrix_id, matrixId),
            lib.isNull(lib.Schema.WMCDM.Criterion.table.deleted_at)
        ))

    const position = (maxPosition[0]?.max || 0) + 1

    const result = await lib.db
        .insert(lib.Schema.WMCDM.Criterion.table)
        .values({
            matrix_id: matrixId,
            name: name,
            weight: weight,
            description: description,
            position: position,
        })
        .returning({ id: lib.Schema.WMCDM.Criterion.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result[0].id
}

export async function updateWmcdmCriterion(
    criterionId: number,
    name: string,
    weight: number,
    description?: string
): Promise<boolean> {
    const result = await lib.db
        .update(lib.Schema.WMCDM.Criterion.table)
        .set({
            name: name,
            weight: weight,
            description: description,
            updated_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Criterion.table.id, criterionId),
            lib.isNull(lib.Schema.WMCDM.Criterion.table.deleted_at)
        ))
        .returning({ id: lib.Schema.WMCDM.Criterion.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result.length > 0
}

export async function deleteWmcdmCriterion(criterionId: number): Promise<boolean> {
    const result = await lib.db
        .update(lib.Schema.WMCDM.Criterion.table)
        .set({
            deleted_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Criterion.table.id, criterionId),
            lib.isNull(lib.Schema.WMCDM.Criterion.table.deleted_at)
        ))
        .returning({ id: lib.Schema.WMCDM.Criterion.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result.length > 0
}

// ## Option Operations

export async function createWmcdmOption(
    matrixId: number,
    name: string
): Promise<number> {
    // Get the next position
    const maxPosition = await lib.db
        .select({ max: lib.Schema.WMCDM.Option.table.position })
        .from(lib.Schema.WMCDM.Option.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Option.table.matrix_id, matrixId),
            lib.isNull(lib.Schema.WMCDM.Option.table.deleted_at)
        ))

    const position = (maxPosition[0]?.max || 0) + 1

    const result = await lib.db
        .insert(lib.Schema.WMCDM.Option.table)
        .values({
            matrix_id: matrixId,
            name: name,
            position: position,
        })
        .returning({ id: lib.Schema.WMCDM.Option.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result[0].id
}

export async function updateWmcdmOption(
    optionId: number,
    name: string
): Promise<boolean> {
    const result = await lib.db
        .update(lib.Schema.WMCDM.Option.table)
        .set({
            name: name,
            updated_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Option.table.id, optionId),
            lib.isNull(lib.Schema.WMCDM.Option.table.deleted_at)
        ))
        .returning({ id: lib.Schema.WMCDM.Option.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result.length > 0
}

export async function deleteWmcdmOption(optionId: number): Promise<boolean> {
    const result = await lib.db
        .update(lib.Schema.WMCDM.Option.table)
        .set({
            deleted_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Option.table.id, optionId),
            lib.isNull(lib.Schema.WMCDM.Option.table.deleted_at)
        ))
        .returning({ id: lib.Schema.WMCDM.Option.table.id })

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return result.length > 0
}

// ## Score Operations

export async function updateWmcdmScore(
    matrixId: number,
    optionId: number,
    criterionId: number,
    score: number
): Promise<boolean> {
    // First try to update existing score
    const updateResult = await lib.db
        .update(lib.Schema.WMCDM.Score.table)
        .set({
            score: score,
            updated_at: new Date(),
        })
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Score.table.matrix_id, matrixId),
            lib.eq(lib.Schema.WMCDM.Score.table.option_id, optionId),
            lib.eq(lib.Schema.WMCDM.Score.table.criterion_id, criterionId)
        ))
        .returning({ id: lib.Schema.WMCDM.Score.table.id })

    // If no existing score, create a new one
    if (updateResult.length === 0) {
        await lib.db
            .insert(lib.Schema.WMCDM.Score.table)
            .values({
                matrix_id: matrixId,
                option_id: optionId,
                criterion_id: criterionId,
                score: score,
            })
    }

    lib.revalidatePath("/my/tools/WMCDM", "layout")

    return true
}

export async function createDefaultScoresForNewCriterion(
    matrixId: number,
    criterionId: number
): Promise<void> {
    // Get all options for this matrix
    const options = await lib.db
        .select()
        .from(lib.Schema.WMCDM.Option.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Option.table.matrix_id, matrixId),
            lib.isNull(lib.Schema.WMCDM.Option.table.deleted_at)
        ))

    // Create default scores (0) for each option
    const scoreValues = options.map(option => ({
        matrix_id: matrixId,
        option_id: option.id,
        criterion_id: criterionId,
        score: 0,
    }))

    if (scoreValues.length > 0) {
        await lib.db.insert(lib.Schema.WMCDM.Score.table).values(scoreValues)
    }

    lib.revalidatePath("/my/tools/WMCDM", "layout")
}

export async function createDefaultScoresForNewOption(
    matrixId: number,
    optionId: number
): Promise<void> {
    // Get all criteria for this matrix
    const criteria = await lib.db
        .select()
        .from(lib.Schema.WMCDM.Criterion.table)
        .where(lib.and(
            lib.eq(lib.Schema.WMCDM.Criterion.table.matrix_id, matrixId),
            lib.isNull(lib.Schema.WMCDM.Criterion.table.deleted_at)
        ))

    // Create default scores (0) for each criterion
    const scoreValues = criteria.map(criterion => ({
        matrix_id: matrixId,
        option_id: optionId,
        criterion_id: criterion.id,
        score: 0,
    }))

    if (scoreValues.length > 0) {
        await lib.db.insert(lib.Schema.WMCDM.Score.table).values(scoreValues)
    }

    lib.revalidatePath("/my/tools/WMCDM", "layout")
}
