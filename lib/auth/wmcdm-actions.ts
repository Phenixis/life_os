"use server";

import { getUser } from "@/lib/db/queries/user/user";
import { redirect } from "next/navigation";
import {
    createWmcdmMatrix,
    getWmcdmMatrices,
    getWmcdmMatrixById,
    updateWmcdmMatrix,
    deleteWmcdmMatrix,
    createWmcdmCriterion,
    deleteWmcdmCriterion,
    createWmcdmOption,
    deleteWmcdmOption,
    updateWmcdmScore
} from "@/lib/db/queries/wmcdm";
import { revalidatePath } from "next/cache";

// Types for the frontend
export type DecisionMatrix = {
    id?: number;
    name: string;
    description?: string;
    criteria: Array<{
        id: string;
        name: string;
        weight: number;
        description: string;
    }>;
    options: Array<{
        id: string;
        name: string;
        scores: Record<string, number>;
    }>;
};

/**
 * Create a new WMCDM matrix
 */
export async function createMatrix(name: string, description?: string): Promise<{ success: boolean; matrixId?: number; error?: string }> {
    try {
        const user = await getUser();
        if (!user) {
            redirect("/login");
        }

        const matrixId = await createWmcdmMatrix(user.id, name, description);
        
        revalidatePath("/my/tools/WMCDM");
        
        return { success: true, matrixId };
    } catch (error) {
        console.error("Error creating matrix:", error);
        return { success: false, error: "Failed to create matrix" };
    }
}

/**
 * Get all matrices for the current user
 */
export async function getUserMatrices(): Promise<{ success: boolean; matrices?: Array<{ id: number; name: string; description?: string; created_at: Date; updated_at: Date }>; error?: string }> {
    try {
        const user = await getUser();
        if (!user) {
            redirect("/login");
        }

        const matrices = await getWmcdmMatrices(user.id);
        
        return { 
            success: true, 
            matrices: matrices.map(m => ({
                id: m.id,
                name: m.name,
                description: m.description || undefined,
                created_at: m.created_at,
                updated_at: m.updated_at
            }))
        };
    } catch (error) {
        console.error("Error getting matrices:", error);
        return { success: false, error: "Failed to get matrices" };
    }
}

/**
 * Get a complete matrix with all its data converted to frontend format
 */
export async function getMatrix(matrixId: number): Promise<{ success: boolean; matrix?: DecisionMatrix; error?: string }> {
    try {
        const user = await getUser();
        if (!user) {
            redirect("/login");
        }

        const matrixData = await getWmcdmMatrixById(user.id, matrixId);
        
        if (!matrixData) {
            return { success: false, error: "Matrix not found" };
        }

        // Convert database format to frontend format
        interface Criterion {
            id: string;
            name: string;
            weight: number;
            description: string;
        }

        interface Option {
            id: string;
            name: string;
            scores: Record<string, number>;
        }

        interface Score {
            criterion_id: number;
            score: number;
        }

        interface MatrixData {
            id: number;
            name: string;
            description?: string;
            criteria: Array<{
            id: number;
            name: string;
            weight: number;
            description?: string;
            }>;
            options: Array<{
            id: number;
            name: string;
            scores: Score[];
            }>;
        }

        const matrixDataTyped: MatrixData = {
            ...matrixData,
            description: matrixData.description === null ? undefined : matrixData.description,
            criteria: matrixData.criteria.map((criterion) => ({
                ...criterion,
                description: criterion.description === null ? undefined : criterion.description
            }))
        };

        const matrix: DecisionMatrix = {
            id: matrixDataTyped.id,
            name: matrixDataTyped.name,
            description: matrixDataTyped.description || '',
            criteria: matrixDataTyped.criteria.map((criterion): Criterion => ({
            id: criterion.id.toString(),
            name: criterion.name,
            weight: criterion.weight,
            description: criterion.description || ''
            })),
            options: matrixDataTyped.options.map((option): Option => {
            const scores: Record<string, number> = {};
            
            // Build scores object for this option
            matrixDataTyped.criteria.forEach((criterion) => {
                const score = option.scores.find((s: Score) => s.criterion_id === criterion.id);
                scores[criterion.id.toString()] = score?.score || 0;
            });
            
            return {
                id: option.id.toString(),
                name: option.name,
                scores
            };
            })
        };
        
        return { success: true, matrix };
    } catch (error) {
        console.error("Error getting matrix:", error);
        return { success: false, error: "Failed to get matrix" };
    }
}

/**
 * Save a complete matrix (handles both create and update operations)
 */
export async function saveMatrix(matrix: DecisionMatrix): Promise<{ success: boolean; matrixId?: number; error?: string }> {
    try {
        const user = await getUser();
        if (!user) {
            redirect("/login");
        }

        return await saveCompleteMatrix(matrix, user.id);
    } catch (error) {
        console.error("Error saving matrix:", error);
        return { success: false, error: "Failed to save matrix" };
    }
}

/**
 * Internal function to save a complete matrix with all its components
 */
async function saveCompleteMatrix(matrix: DecisionMatrix, userId: string): Promise<{ success: boolean; matrixId?: number; error?: string }> {
    try {
        let matrixId: number;

        if (matrix.id) {
            // Update existing matrix
            const success = await updateWmcdmMatrix(userId, matrix.id, matrix.name, matrix.description);
            if (!success) {
                return { success: false, error: "Failed to update matrix" };
            }
            matrixId = matrix.id;

            // Delete existing criteria and options (this will cascade to scores)
            const existingMatrix = await getWmcdmMatrixById(userId, matrixId);
            if (existingMatrix) {
                // Delete existing criteria
                for (const criterion of existingMatrix.criteria) {
                    await deleteWmcdmCriterion(criterion.id);
                }
                
                // Delete existing options
                for (const option of existingMatrix.options) {
                    await deleteWmcdmOption(option.id);
                }
            }
        } else {
            // Create new matrix
            matrixId = await createWmcdmMatrix(userId, matrix.name, matrix.description);
        }

        // Create criteria
        const criteriaMap = new Map<string, number>();
        for (let i = 0; i < matrix.criteria.length; i++) {
            const criterion = matrix.criteria[i];
            const criterionId = await createWmcdmCriterion(
                matrixId,
                criterion.name,
                criterion.weight,
                criterion.description
            );
            criteriaMap.set(criterion.id, criterionId);
        }

        // Create options
        const optionsMap = new Map<string, number>();
        for (let i = 0; i < matrix.options.length; i++) {
            const option = matrix.options[i];
            const optionId = await createWmcdmOption(matrixId, option.name);
            optionsMap.set(option.id, optionId);
        }

        // Create scores
        for (const option of matrix.options) {
            const optionId = optionsMap.get(option.id);
            if (!optionId) continue;

            for (const criterion of matrix.criteria) {
                const criterionId = criteriaMap.get(criterion.id);
                if (!criterionId) continue;

                const score = option.scores[criterion.id] || 0;
                await updateWmcdmScore(matrixId, optionId, criterionId, score);
            }
        }

        revalidatePath("/my/tools/WMCDM");
        
        return { success: true, matrixId };
    } catch (error) {
        console.error("Error in saveCompleteMatrix:", error);
        return { success: false, error: "Failed to save matrix" };
    }
}

/**
 * Delete a matrix
 */
export async function removeMatrix(matrixId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser();
        if (!user) {
            redirect("/login");
        }

        const success = await deleteWmcdmMatrix(user.id, matrixId);
        
        if (!success) {
            return { success: false, error: "Failed to delete matrix" };
        }

        revalidatePath("/my/tools/WMCDM");
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting matrix:", error);
        return { success: false, error: "Failed to delete matrix" };
    }
}

/**
 * Duplicate a matrix
 */
export async function duplicateMatrix(matrixId: number, newName: string): Promise<{ success: boolean; matrixId?: number; error?: string }> {
    try {
        const user = await getUser();
        if (!user) {
            redirect("/login");
        }

        // Get the original matrix
        const originalResult = await getMatrix(matrixId);
        
        if (!originalResult.success || !originalResult.matrix) {
            return { success: false, error: "Original matrix not found" };
        }

        // Create a copy with new name and no ID
        const duplicatedMatrix: DecisionMatrix = {
            ...originalResult.matrix,
            id: undefined,
            name: newName
        };

        // Save the duplicated matrix
        return await saveCompleteMatrix(duplicatedMatrix, user.id);
    } catch (error) {
        console.error("Error duplicating matrix:", error);
        return { success: false, error: "Failed to duplicate matrix" };
    }
}
