import * as lib from "../lib";
import { QueryModel } from "../model";

const table = lib.Schema.MealPlanner.Meal.table;
type New = lib.Schema.MealPlanner.Meal.Insert
type Existing = lib.Schema.MealPlanner.Meal.Select

export type MealWithIngredients = Existing & {
    ingredients: Array<lib.Schema.MealPlanner.Ingredient.Select & {
        quantity: number;
        unit: string;
    }>;
};

export class MealQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }

    /**
     * Get meals by user ID with optional search and sorting
     */
    async getByUserId(
        userId: string,
        options?: {
            searchQuery?: string;
            orderBy?: "created_at" | "updated_at" | "name";
            orderingDirection?: "asc" | "desc";
            limit?: number;
            offset?: number;
        }
    ): Promise<{ success: string; meals: Existing[] } | { error: string }> {
        const {
            searchQuery,
            orderBy = "created_at",
            orderingDirection = "desc",
            limit = 50,
            offset = 0
        } = options || {};

        const orderColumn = table[orderBy];
        const orderFn = orderingDirection === "asc" ? lib.asc : lib.desc;

        const result = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.user_id, userId),
                    lib.isNull(table.deleted_at),
                    searchQuery
                        ? lib.sql`LOWER(${table.name}) LIKE LOWER(${'%' + searchQuery + '%'})`
                        : undefined
                )
            )
            .orderBy(orderFn(orderColumn))
            .limit(limit)
            .offset(offset);

        return { success: "Meals retrieved successfully.", meals: result };
    }

    /**
     * Get a single meal by ID with its ingredients
     */
    async getByIdWithIngredients(
        mealId: number,
        userId: string
    ): Promise<{ success: string; meal: MealWithIngredients } | { error: string }> {
        const result = await this.getByIdsWithIngredients([mealId], userId);

        if ("error" in result) {
            return { error: result.error };
        }

        if (result.meals.length === 0) {
            return { error: "Meal not found." };
        }

        return { success: "Meal retrieved successfully.", meal: result.meals[0] };
    }

    /**
     * Get multiple meals by IDs with their ingredients
     */
    async getByIdsWithIngredients(
        mealIds: number[],
        userId: string
    ): Promise<{ success: string; meals: MealWithIngredients[] } | { error: string }> {
        if (mealIds.length === 0) {
            return { success: "No meals to retrieve.", meals: [] };
        }

        // Get meals
        const meals = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.inArray(table.id, mealIds),
                    lib.eq(table.user_id, userId),
                    lib.isNull(table.deleted_at)
                )
            );

        if (meals.length === 0) {
            return { success: "No meals found.", meals: [] };
        }

        // Get ingredients for all meals
        const ingredientsData = await lib.db
            .select({
                meal_id: lib.Schema.MealPlanner.IngredientToMeal.table.meal_id,
                ingredient_id: lib.Schema.MealPlanner.Ingredient.table.id,
                name: lib.Schema.MealPlanner.Ingredient.table.name,
                description: lib.Schema.MealPlanner.Ingredient.table.description,
                image_url: lib.Schema.MealPlanner.Ingredient.table.image_url,
                user_id: lib.Schema.MealPlanner.Ingredient.table.user_id,
                created_at: lib.Schema.MealPlanner.Ingredient.table.created_at,
                updated_at: lib.Schema.MealPlanner.Ingredient.table.updated_at,
                deleted_at: lib.Schema.MealPlanner.Ingredient.table.deleted_at,
                quantity: lib.Schema.MealPlanner.IngredientToMeal.table.quantity,
                unit: lib.Schema.MealPlanner.IngredientToMeal.table.unit,
            })
            .from(lib.Schema.MealPlanner.IngredientToMeal.table)
            .innerJoin(
                lib.Schema.MealPlanner.Ingredient.table,
                lib.eq(
                    lib.Schema.MealPlanner.IngredientToMeal.table.ingredient_id,
                    lib.Schema.MealPlanner.Ingredient.table.id
                )
            )
            .where(
                lib.and(
                    lib.inArray(lib.Schema.MealPlanner.IngredientToMeal.table.meal_id, mealIds),
                    lib.isNull(lib.Schema.MealPlanner.IngredientToMeal.table.deleted_at),
                    lib.isNull(lib.Schema.MealPlanner.Ingredient.table.deleted_at)
                )
            );

        // Group ingredients by meal_id
        const ingredientsByMeal = ingredientsData.reduce((acc, row) => {
            if (!acc[row.meal_id]) {
                acc[row.meal_id] = [];
            }
            acc[row.meal_id].push({
                id: row.ingredient_id,
                name: row.name,
                description: row.description,
                image_url: row.image_url,
                user_id: row.user_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
                deleted_at: row.deleted_at,
                quantity: row.quantity,
                unit: row.unit,
            });
            return acc;
        }, {} as Record<number, Array<lib.Schema.MealPlanner.Ingredient.Select & { quantity: number; unit: string }>>);

        // Combine meals with their ingredients
        const mealsWithIngredients: MealWithIngredients[] = meals.map(meal => ({
            ...meal,
            ingredients: ingredientsByMeal[meal.id] || []
        }));

        return { success: "Meals with ingredients retrieved successfully.", meals: mealsWithIngredients };
    }

    /**
     * Get all meals for a user with their ingredients
     */
    async getAllWithIngredients(
        userId: string,
        options?: {
            searchQuery?: string;
            orderBy?: "created_at" | "updated_at" | "name";
            orderingDirection?: "asc" | "desc";
            limit?: number;
            offset?: number;
        }
    ): Promise<{ success: string; meals: MealWithIngredients[] } | { error: string }> {
        // First get the meals
        const mealsResult = await this.getByUserId(userId, options);

        if ("error" in mealsResult) {
            return { error: mealsResult.error };
        }

        const mealIds = mealsResult.meals.map(m => m.id);

        if (mealIds.length === 0) {
            return { success: "No meals found.", meals: [] };
        }

        // Then get them with ingredients
        return this.getByIdsWithIngredients(mealIds, userId);
    }
}