"use client"

// Query hooks
export {
    useMealsQuery,
    useMealQuery,
    useIngredientsQuery,
    useIngredientQuery,
} from "./queries/use-meal-planner-query"

// Mutation hooks
export {
    useCreateMeal,
    useUpdateMeal,
    useDeleteMeal,
    useAddIngredientToMeal,
    useRemoveIngredientFromMeal,
    useCreateIngredient,
    useUpdateIngredient,
    useDeleteIngredient,
} from "./queries/use-meal-planner-mutations"

// Re-export types
export type {
    Meal,
    BasicMeal,
    Ingredient,
    MealFilters,
    IngredientFilters,
    MealCreateInput,
    MealUpdateInput,
    IngredientCreateInput,
    IngredientUpdateInput,
    AddIngredientToMealInput,
} from "@/lib/api/meal-planner-keys"

