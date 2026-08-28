import { fetchWithAuth } from "../fetcher"
import type {
    Meal,
    Ingredient,
    MealCreateInput,
    MealUpdateInput,
    IngredientCreateInput,
    IngredientUpdateInput,
    AddIngredientToMealInput,
    MealFilters,
    IngredientFilters,
} from "./meal-planner-keys"

const BASE_URL = "/api"

/**
 * Build query string from filters
 */
function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString())
        }
    })
    return searchParams.toString()
}

// ============= MEAL API =============

export const mealApi = {
    /**
     * Fetch all meals for the user
     */
    getMeals: async (filters: MealFilters, apiKey: string): Promise<Meal[]> => {
        const queryString = buildQueryString({
            searchQuery: filters.searchQuery,
            orderBy: filters.orderBy,
            orderingDirection: filters.orderingDirection,
            limit: filters.limit,
            offset: filters.offset,
            withIngredients: filters.withIngredients ? "true" : "false",
        })

        const response = await fetchWithAuth<{ success: string; meals: Meal[] }>(
            `${BASE_URL}/meal?${queryString}`,
            apiKey
        )
        return response.meals
    },

    /**
     * Fetch a single meal by ID
     */
    getMeal: async (id: number, apiKey: string): Promise<Meal> => {
        const response = await fetchWithAuth<{ success: string; meal: Meal }>(
            `${BASE_URL}/meal/${id}`,
            apiKey
        )
        return response.meal
    },

    /**
     * Create a new meal
     */
    createMeal: async (data: MealCreateInput, apiKey: string): Promise<Meal> => {
        const response = await fetchWithAuth<{ success: string; createdEntity: Meal }>(
            `${BASE_URL}/meal`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
        return response.createdEntity
    },

    /**
     * Update a meal
     */
    updateMeal: async (id: number, data: MealUpdateInput, apiKey: string): Promise<Meal> => {
        const response = await fetchWithAuth<{ success: string; updatedEntity: Meal }>(
            `${BASE_URL}/meal/${id}`,
            apiKey,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        )
        return response.updatedEntity
    },

    /**
     * Delete a meal
     */
    deleteMeal: async (id: number, apiKey: string): Promise<void> => {
        await fetchWithAuth<{ success: string }>(
            `${BASE_URL}/meal/${id}`,
            apiKey,
            { method: "DELETE" }
        )
    },

    /**
     * Get ingredients for a meal
     */
    getMealIngredients: async (mealId: number, apiKey: string): Promise<Ingredient[]> => {
        const response = await fetchWithAuth<{ success: string; ingredients: Ingredient[] }>(
            `${BASE_URL}/meal/${mealId}/ingredients`,
            apiKey
        )
        return response.ingredients
    },

    /**
     * Add ingredient to meal
     */
    addIngredientToMeal: async (
        mealId: number,
        data: AddIngredientToMealInput,
        apiKey: string
    ): Promise<void> => {
        await fetchWithAuth(
            `${BASE_URL}/meal/${mealId}/ingredients`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
    },

    /**
     * Remove ingredient from meal
     */
    removeIngredientFromMeal: async (
        mealId: number,
        ingredientId: number,
        apiKey: string
    ): Promise<void> => {
        await fetchWithAuth(
            `${BASE_URL}/meal/${mealId}/ingredients?ingredient_id=${ingredientId}`,
            apiKey,
            { method: "DELETE" }
        )
    },
}

// ============= INGREDIENT API =============

export const ingredientApi = {
    /**
     * Fetch all ingredients for the user
     */
    getIngredients: async (filters: IngredientFilters, apiKey: string): Promise<Ingredient[]> => {
        const queryString = buildQueryString({
            searchQuery: filters.searchQuery,
            orderBy: filters.orderBy,
            orderingDirection: filters.orderingDirection,
            limit: filters.limit,
            offset: filters.offset,
        })

        const response = await fetchWithAuth<{ success: string; ingredients: Ingredient[] }>(
            `${BASE_URL}/ingredient?${queryString}`,
            apiKey
        )
        return response.ingredients
    },

    /**
     * Fetch a single ingredient by ID
     */
    getIngredient: async (id: number, apiKey: string): Promise<Ingredient> => {
        const response = await fetchWithAuth<{ success: string; entity: Ingredient }>(
            `${BASE_URL}/ingredient/${id}`,
            apiKey
        )
        return response.entity
    },

    /**
     * Create a new ingredient
     */
    createIngredient: async (data: IngredientCreateInput, apiKey: string): Promise<Ingredient> => {
        const response = await fetchWithAuth<{ success: string; createdEntity: Ingredient }>(
            `${BASE_URL}/ingredient`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
        return response.createdEntity
    },

    /**
     * Update an ingredient
     */
    updateIngredient: async (
        id: number,
        data: IngredientUpdateInput,
        apiKey: string
    ): Promise<Ingredient> => {
        const response = await fetchWithAuth<{ success: string; updatedEntity: Ingredient }>(
            `${BASE_URL}/ingredient/${id}`,
            apiKey,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        )
        return response.updatedEntity
    },

    /**
     * Delete an ingredient
     */
    deleteIngredient: async (id: number, apiKey: string): Promise<void> => {
        await fetchWithAuth<{ success: string }>(
            `${BASE_URL}/ingredient/${id}`,
            apiKey,
            { method: "DELETE" }
        )
    },
}
