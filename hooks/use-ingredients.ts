"use client"

// Re-export ingredient hooks from use-meals
export {
    useIngredientsQuery,
    useIngredientsQuery as useIngredients,
    useIngredientQuery,
    useIngredientQuery as useIngredient,
    useCreateIngredient,
    useUpdateIngredient,
    useDeleteIngredient,
} from "./use-meals"

// Re-export types
export type {
    Ingredient,
    IngredientFilters,
    IngredientCreateInput,
    IngredientUpdateInput,
} from "@/lib/api/meal-planner-keys"

