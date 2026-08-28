import type { MealWithIngredients } from "@/lib/db/queries/meal-planner/meal"
import * as Schema from "@/lib/db/schema"

/**
 * Query keys factory for meal planner
 * Provides type-safe, hierarchical query keys following React Query best practices
 */
export const mealPlannerKeys = {
    // Meals
    all: ['meal-planner'] as const,
    meals: () => [...mealPlannerKeys.all, 'meals'] as const,
    mealsList: (filters: MealFilters) => [...mealPlannerKeys.meals(), 'list', filters] as const,
    mealDetail: (id: number) => [...mealPlannerKeys.meals(), 'detail', id] as const,

    // Ingredients
    ingredients: () => [...mealPlannerKeys.all, 'ingredients'] as const,
    ingredientsList: (filters: IngredientFilters) => [...mealPlannerKeys.ingredients(), 'list', filters] as const,
    ingredientDetail: (id: number) => [...mealPlannerKeys.ingredients(), 'detail', id] as const,
}

// Type definitions
export type Meal = MealWithIngredients
export type BasicMeal = Schema.MealPlanner.Meal.Select
export type Ingredient = Schema.MealPlanner.Ingredient.Select

export interface MealFilters {
    searchQuery?: string
    orderBy?: "created_at" | "updated_at" | "name"
    orderingDirection?: "asc" | "desc"
    limit?: number
    offset?: number
    withIngredients?: boolean
}

export interface IngredientFilters {
    searchQuery?: string
    orderBy?: "created_at" | "updated_at" | "name"
    orderingDirection?: "asc" | "desc"
    limit?: number
    offset?: number
}

export interface MealCreateInput {
    name: string
    description?: string
    image_url?: string
    ingredients?: Array<{
        name: string
        quantity?: number
        unit?: string
        description?: string
        image_url?: string
    }>
}

export interface MealUpdateInput {
    name?: string
    description?: string | null
    image_url?: string | null
    ingredients?: Array<{
        name: string
        quantity?: number
        unit?: string
        description?: string
        image_url?: string
    }>
}

export interface IngredientCreateInput {
    name: string
    description?: string
    image_url?: string
}

export interface IngredientUpdateInput {
    name?: string
    description?: string | null
    image_url?: string | null
}

export interface AddIngredientToMealInput {
    ingredient_id?: number
    ingredient_name?: string
    quantity?: number
    unit?: string
    description?: string
    image_url?: string
}
