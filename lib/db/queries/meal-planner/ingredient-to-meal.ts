import * as lib from "../lib";
import { QueryModel } from "../model";

const table = lib.Schema.MealPlanner.IngredientToMeal.table;
type New = lib.Schema.MealPlanner.IngredientToMeal.Insert
type Existing = lib.Schema.MealPlanner.IngredientToMeal.Select

export class IngredientToMealQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }

    /**
     * Add an ingredient to a meal
     */
    async addIngredientToMeal(
        mealId: number,
        ingredientId: number,
        quantity: number = 1,
        unit: string = "unit"
    ): Promise<{ success: string; relation: Existing } | { error: string }> {
        // Check if relation already exists
        const existing = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.meal_id, mealId),
                    lib.eq(table.ingredient_id, ingredientId),
                    lib.isNull(table.deleted_at)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // Update quantity if already exists
            const result = await this.update(existing[0].id, { quantity, unit });
            if ('error' in result) {
                return result;
            }
            return { success: result.success, relation: result.updatedEntity };
        }

        // Create new relation
        const result = await this.create({
            meal_id: mealId,
            ingredient_id: ingredientId,
            quantity,
            unit
        });
        if ('error' in result) {
            return result;
        }
        return { success: result.success, relation: result.createdEntity };
    }

    /**
     * Remove an ingredient from a meal
     */
    async removeIngredientFromMeal(
        mealId: number,
        ingredientId: number
    ): Promise<{ success: string } | { error: string }> {
        const result = await lib.db
            .update(table)
            .set({ deleted_at: new Date() })
            .where(
                lib.and(
                    lib.eq(table.meal_id, mealId),
                    lib.eq(table.ingredient_id, ingredientId),
                    lib.isNull(table.deleted_at)
                )
            )
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Ingredient not found on this meal." };
        }

        return { success: "Ingredient removed from meal successfully." };
    }

    /**
     * Update ingredient quantity on a meal
     */
    async updateIngredientQuantity(
        mealId: number,
        ingredientId: number,
        quantity: number,
        unit?: string
    ): Promise<{ success: string; relation: Existing } | { error: string }> {
        const updateData: Partial<New> = { quantity };
        if (unit) {
            updateData.unit = unit;
        }

        const result = await lib.db
            .update(table)
            .set({
                ...updateData,
                updated_at: new Date()
            })
            .where(
                lib.and(
                    lib.eq(table.meal_id, mealId),
                    lib.eq(table.ingredient_id, ingredientId),
                    lib.isNull(table.deleted_at)
                )
            )
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Ingredient not found on this meal." };
        }

        return { success: "Ingredient quantity updated successfully.", relation: result[0] };
    }

    /**
     * Get all ingredients for a meal
     */
    async getIngredientsByMealId(
        mealId: number
    ): Promise<{ success: string; ingredients: Existing[] } | { error: string }> {
        const result = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.meal_id, mealId),
                    lib.isNull(table.deleted_at)
                )
            );

        return { success: "Ingredients retrieved successfully.", ingredients: result };
    }

    /**
     * Bulk add/update ingredients to a meal
     */
    async setMealIngredients(
        mealId: number,
        ingredients: Array<{ ingredientId: number; quantity: number; unit: string }>
    ): Promise<{ success: string } | { error: string }> {
        // Get existing relations
        const existing = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.meal_id, mealId),
                    lib.isNull(table.deleted_at)
                )
            );

        const newIds = new Set(ingredients.map(i => i.ingredientId));

        // Remove ingredients that are no longer in the list
        const toRemove = existing.filter(e => !newIds.has(e.ingredient_id));
        if (toRemove.length > 0) {
            await lib.db
                .update(table)
                .set({ deleted_at: new Date() })
                .where(lib.inArray(table.id, toRemove.map(r => r.id)));
        }

        // Add or update ingredients
        for (const ingredient of ingredients) {
            await this.addIngredientToMeal(
                mealId,
                ingredient.ingredientId,
                ingredient.quantity,
                ingredient.unit
            );
        }

        return { success: "Meal ingredients updated successfully." };
    }

    /**
     * Delete ingredients that are not saved in the list maker when deleting a meal
     */
    async deleteUnsavedIngredientsForMeal(
        mealId: number
    ): Promise<{ success: string } | { error: string }> {
        // Get all ingredient_to_meal relations for this meal
        const ingredientToMealRelations = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.meal_id, mealId),
                    lib.isNull(table.deleted_at)
                )
            );

        if (ingredientToMealRelations.length === 0) {
            return { success: "No ingredients to delete." };
        }

        const ingredientToMealIds = ingredientToMealRelations.map(r => r.id);

        // Check which ingredient_to_meal relations are saved in the list
        const savedInList = await lib.db
            .select({
                ingredient_to_meal_id: lib.Schema.MealPlanner.IngredientToMealToList.table.ingredient_to_meal_id
            })
            .from(lib.Schema.MealPlanner.IngredientToMealToList.table)
            .where(
                lib.and(
                    lib.inArray(
                        lib.Schema.MealPlanner.IngredientToMealToList.table.ingredient_to_meal_id,
                        ingredientToMealIds
                    ),
                    lib.isNull(lib.Schema.MealPlanner.IngredientToMealToList.table.deleted_at)
                )
            );

        const savedIngredientToMealIds = new Set(savedInList.map(s => s.ingredient_to_meal_id));

        // Find unsaved ingredient_to_meal relations
        const unsavedRelations = ingredientToMealRelations.filter(
            r => !savedIngredientToMealIds.has(r.id)
        );

        if (unsavedRelations.length === 0) {
            return { success: "All ingredients are saved in list maker." };
        }

        // Get the ingredient IDs that are not saved
        const unsavedIngredientIds = unsavedRelations.map(r => r.ingredient_id);

        // Soft delete these ingredient_to_meal relations
        await lib.db
            .update(table)
            .set({ deleted_at: new Date() })
            .where(
                lib.inArray(table.id, unsavedRelations.map(r => r.id))
            );

        // For each unsaved ingredient, check if it's used in other meals
        // If not, soft delete the ingredient itself
        for (const ingredientId of unsavedIngredientIds) {
            const otherMealUsage = await lib.db
                .select()
                .from(table)
                .where(
                    lib.and(
                        lib.eq(table.ingredient_id, ingredientId),
                        lib.ne(table.meal_id, mealId),
                        lib.isNull(table.deleted_at)
                    )
                )
                .limit(1);

            // If ingredient is not used in any other meal, delete it
            if (otherMealUsage.length === 0) {
                await lib.db
                    .update(lib.Schema.MealPlanner.Ingredient.table)
                    .set({ deleted_at: new Date() })
                    .where(lib.eq(lib.Schema.MealPlanner.Ingredient.table.id, ingredientId));
            }
        }

        return { success: `Deleted ${unsavedRelations.length} unsaved ingredient(s) from meal.` };
    }
}