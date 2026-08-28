"use client"

import { useQuery } from "@tanstack/react-query"
import { useUser } from "../use-user"
import { mealApi, ingredientApi } from "@/lib/api/meal-planner.api"
import { mealPlannerKeys, type MealFilters, type IngredientFilters } from "@/lib/api/meal-planner-keys"

/**
 * Hook to fetch all meals for the user
 */
export function useMealsQuery(filters: MealFilters = {}, options?: { enabled?: boolean }) {
    const { user } = useUser()

    const finalFilters: MealFilters = {
        orderBy: "created_at",
        orderingDirection: "desc",
        limit: 50,
        offset: 0,
        withIngredients: true,
        ...filters,
    }

    const query = useQuery({
        queryKey: mealPlannerKeys.mealsList(finalFilters),
        queryFn: () => mealApi.getMeals(finalFilters, user?.api_key || ""),
        enabled: options?.enabled !== false && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        ...query,
        meals: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    }
}

/**
 * Hook to fetch a single meal by ID
 */
export function useMealQuery(id: number | undefined, options?: { enabled?: boolean }) {
    const { user } = useUser()

    return useQuery({
        queryKey: mealPlannerKeys.mealDetail(id!),
        queryFn: () => mealApi.getMeal(id!, user?.api_key || ""),
        enabled: options?.enabled !== false && !!id && !!user?.api_key,
        staleTime: 5000,
    })
}

/**
 * Hook to fetch all ingredients for the user
 */
export function useIngredientsQuery(filters: IngredientFilters = {}, options?: { enabled?: boolean }) {
    const { user } = useUser()

    const finalFilters: IngredientFilters = {
        orderBy: "name",
        orderingDirection: "asc",
        limit: 100,
        offset: 0,
        ...filters,
    }

    const query = useQuery({
        queryKey: mealPlannerKeys.ingredientsList(finalFilters),
        queryFn: () => ingredientApi.getIngredients(finalFilters, user?.api_key || ""),
        enabled: options?.enabled !== false && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        ...query,
        ingredients: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    }
}

/**
 * Hook to fetch a single ingredient by ID
 */
export function useIngredientQuery(id: number | undefined, options?: { enabled?: boolean }) {
    const { user } = useUser()

    return useQuery({
        queryKey: mealPlannerKeys.ingredientDetail(id!),
        queryFn: () => ingredientApi.getIngredient(id!, user?.api_key || ""),
        enabled: options?.enabled !== false && !!id && !!user?.api_key,
        staleTime: 5000,
    })
}
