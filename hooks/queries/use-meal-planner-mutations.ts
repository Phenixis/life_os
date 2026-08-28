"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "../use-user"
import { mealApi, ingredientApi } from "@/lib/api/meal-planner.api"
import { mealPlannerKeys, type MealCreateInput, type MealUpdateInput, type IngredientCreateInput, type IngredientUpdateInput, type AddIngredientToMealInput } from "@/lib/api/meal-planner-keys"

// ============= MEAL MUTATIONS =============

/**
 * Hook to create a new meal
 */
export function useCreateMeal() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: MealCreateInput) => mealApi.createMeal(data, user?.api_key || ""),
        onMutate: async (newMeal) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.meals() })

            // Snapshot previous value
            const previousMeals = queryClient.getQueriesData({ queryKey: mealPlannerKeys.meals() })

            // Optimistically update to show the new meal
            queryClient.setQueriesData({ queryKey: mealPlannerKeys.meals() }, (old: any) => {
                if (!old) return old

                // Create optimistic meal with temporary ID
                const optimisticMeal = {
                    id: Date.now(), // Temporary ID
                    name: newMeal.name,
                    description: newMeal.description || null,
                    image_url: newMeal.image_url || null,
                    user_id: user?.id || "",
                    created_at: new Date(),
                    updated_at: new Date(),
                    deleted_at: null,
                    ingredients: newMeal.ingredients?.map((ing: any) => ({
                        id: Date.now() + Math.random(),
                        name: ing.name,
                        description: null,
                        image_url: null,
                        user_id: user?.id || "",
                        created_at: new Date(),
                        updated_at: new Date(),
                        deleted_at: null,
                    })) || [],
                }

                // Add to the list - data is an array directly
                return Array.isArray(old) ? [optimisticMeal, ...old] : old
            })

            // Return context with snapshot
            return { previousMeals }
        },
        onError: (err, newMeal, context) => {
            // Rollback to previous value on error
            if (context?.previousMeals) {
                context.previousMeals.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
        },
        onSuccess: (createdMeal) => {
            // Add newly created ingredients to the ingredients cache
            if (createdMeal.ingredients && createdMeal.ingredients.length > 0) {
                queryClient.setQueriesData({ queryKey: mealPlannerKeys.ingredients() }, (old: any) => {
                    if (!old) return old

                    // Data is an array directly
                    const existingIds = new Set(Array.isArray(old) ? old.map((ing: any) => ing.id) : [])
                    
                    // Filter out ingredients that already exist
                    const newIngredients = createdMeal.ingredients.filter(
                        (ing: any) => !existingIds.has(ing.id)
                    )

                    // Add new ingredients to the cache
                    if (Array.isArray(old)) {
                        return [...newIngredients, ...old]
                    }
                    return old
                })
            }

            // Refetch to ensure data consistency
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.meals() })
        },
    })
}

/**
 * Hook to update a meal
 */
export function useUpdateMeal() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: MealUpdateInput }) =>
            mealApi.updateMeal(id, data, user?.api_key || ""),
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.mealDetail(variables.id) })
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.meals() })

            // Snapshot previous values
            const previousMeal = queryClient.getQueryData(mealPlannerKeys.mealDetail(variables.id))
            const previousMeals = queryClient.getQueriesData({ queryKey: mealPlannerKeys.meals() })

            // Optimistically update meal detail
            queryClient.setQueryData(mealPlannerKeys.mealDetail(variables.id), (old: any) => {
                if (!old) return old
                return {
                    ...old,
                    meal: {
                        ...old.meal,
                        ...variables.data,
                        updated_at: new Date(),
                    }
                }
            })

            // Optimistically update meals list
            queryClient.setQueriesData({ queryKey: mealPlannerKeys.meals() }, (old: any) => {
                if (!old || !Array.isArray(old)) return old
                
                return old.map((meal: any) =>
                    meal.id === variables.id
                        ? { ...meal, ...variables.data, updated_at: new Date() }
                        : meal
                )
            })

            return { previousMeal, previousMeals }
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousMeal) {
                queryClient.setQueryData(mealPlannerKeys.mealDetail(variables.id), context.previousMeal)
            }
            if (context?.previousMeals) {
                context.previousMeals.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
        },
        onSuccess: (updatedMeal, variables) => {
            // Add newly created ingredients to the ingredients cache
            if (updatedMeal.ingredients && updatedMeal.ingredients.length > 0) {
                queryClient.setQueriesData({ queryKey: mealPlannerKeys.ingredients() }, (old: any) => {
                    if (!old) return old

                    // Data is an array directly
                    const existingIds = new Set(Array.isArray(old) ? old.map((ing: any) => ing.id) : [])
                    
                    // Filter out ingredients that already exist
                    const newIngredients = updatedMeal.ingredients.filter(
                        (ing: any) => !existingIds.has(ing.id)
                    )

                    // Add new ingredients to the cache
                    if (Array.isArray(old)) {
                        return [...newIngredients, ...old]
                    }
                    return old
                })
            }

            // Invalidate to ensure consistency
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.mealDetail(variables.id) })
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.meals() })
        },
    })
}

/**
 * Hook to delete a meal
 */
export function useDeleteMeal() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => mealApi.deleteMeal(id, user?.api_key || ""),
        onMutate: async (mealId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.meals() })

            // Snapshot previous value
            const previousMeals = queryClient.getQueriesData({ queryKey: mealPlannerKeys.meals() })

            // Optimistically remove from list
            queryClient.setQueriesData({ queryKey: mealPlannerKeys.meals() }, (old: any) => {
                if (!old || !Array.isArray(old)) return old
                
                return old.filter((meal: any) => meal.id !== mealId)
            })

            return { previousMeals }
        },
        onError: (err, mealId, context) => {
            // Rollback on error
            if (context?.previousMeals) {
                context.previousMeals.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
        },
        onSuccess: (_, id) => {
            // Remove specific meal from cache
            queryClient.removeQueries({ queryKey: mealPlannerKeys.mealDetail(id) })
            // Invalidate meals list to ensure consistency
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.meals() })
        },
    })
}

/**
 * Hook to add an ingredient to a meal
 */
export function useAddIngredientToMeal() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ mealId, data }: { mealId: number; data: AddIngredientToMealInput }) =>
            mealApi.addIngredientToMeal(mealId, data, user?.api_key || ""),
        onSuccess: (_, variables) => {
            // Invalidate meal detail to refresh ingredients
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.mealDetail(variables.mealId) })
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.meals() })
        },
    })
}

/**
 * Hook to remove an ingredient from a meal
 */
export function useRemoveIngredientFromMeal() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ mealId, ingredientId }: { mealId: number; ingredientId: number }) =>
            mealApi.removeIngredientFromMeal(mealId, ingredientId, user?.api_key || ""),
        onSuccess: (_, variables) => {
            // Invalidate meal detail to refresh ingredients
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.mealDetail(variables.mealId) })
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.meals() })
        },
    })
}

// ============= INGREDIENT MUTATIONS =============

/**
 * Hook to create a new ingredient with optimistic update
 */
export function useCreateIngredient() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: IngredientCreateInput) => ingredientApi.createIngredient(data, user?.api_key || ""),
        onMutate: async (newIngredient) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.ingredients() })

            // Snapshot previous value
            const previousIngredients = queryClient.getQueriesData({ queryKey: mealPlannerKeys.ingredients() })

            // Optimistically update to show the new ingredient
            queryClient.setQueriesData({ queryKey: mealPlannerKeys.ingredients() }, (old: any) => {
                if (!old) return old

                // Create optimistic ingredient with temporary ID
                const optimisticIngredient = {
                    id: Date.now(), // Temporary ID
                    name: newIngredient.name,
                    description: newIngredient.description || null,
                    image_url: newIngredient.image_url || null,
                    user_id: user?.id || "",
                    created_at: new Date(),
                    updated_at: new Date(),
                    deleted_at: null,
                }

                // Add to the list
                return Array.isArray(old) ? [optimisticIngredient, ...old] : old
            })

            // Return context with snapshot
            return { previousIngredients }
        },
        onError: (err, newIngredient, context) => {
            // Rollback to previous value on error
            if (context?.previousIngredients) {
                context.previousIngredients.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
        },
        onSettled: () => {
            // Refetch to ensure data consistency
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.ingredients() })
        },
    })
}

/**
 * Hook to update an ingredient with optimistic update
 */
export function useUpdateIngredient() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IngredientUpdateInput }) =>
            ingredientApi.updateIngredient(id, data, user?.api_key || ""),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.ingredients() })
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.ingredientDetail(id) })

            // Snapshot previous values
            const previousIngredients = queryClient.getQueriesData({ queryKey: mealPlannerKeys.ingredients() })
            const previousIngredient = queryClient.getQueryData(mealPlannerKeys.ingredientDetail(id))

            // Optimistically update the ingredient in all lists
            queryClient.setQueriesData({ queryKey: mealPlannerKeys.ingredients() }, (old: any) => {
                if (!old || !Array.isArray(old)) return old

                return old.map((ingredient: any) =>
                    ingredient.id === id
                        ? {
                            ...ingredient,
                            name: data.name ?? ingredient.name,
                            description: data.description !== undefined ? data.description : ingredient.description,
                            image_url: data.image_url !== undefined ? data.image_url : ingredient.image_url,
                            updated_at: new Date(),
                        }
                        : ingredient
                )
            })

            // Optimistically update the ingredient detail
            queryClient.setQueryData(mealPlannerKeys.ingredientDetail(id), (old: any) => {
                if (!old) return old

                return {
                    ...old,
                    name: data.name ?? old.name,
                    description: data.description !== undefined ? data.description : old.description,
                    image_url: data.image_url !== undefined ? data.image_url : old.image_url,
                    updated_at: new Date(),
                }
            })

            // Return context with snapshots
            return { previousIngredients, previousIngredient }
        },
        onError: (err, { id }, context) => {
            // Rollback to previous values on error
            if (context?.previousIngredients) {
                context.previousIngredients.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
            if (context?.previousIngredient) {
                queryClient.setQueryData(mealPlannerKeys.ingredientDetail(id), context.previousIngredient)
            }
        },
        onSettled: (_, __, { id }) => {
            // Refetch to ensure data consistency
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.ingredientDetail(id) })
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.ingredients() })
        },
    })
}

/**
 * Hook to delete an ingredient with optimistic update
 */
export function useDeleteIngredient() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => ingredientApi.deleteIngredient(id, user?.api_key || ""),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.ingredients() })
            await queryClient.cancelQueries({ queryKey: mealPlannerKeys.ingredientDetail(id) })

            // Snapshot previous values
            const previousIngredients = queryClient.getQueriesData({ queryKey: mealPlannerKeys.ingredients() })
            const previousIngredient = queryClient.getQueryData(mealPlannerKeys.ingredientDetail(id))

            // Optimistically remove the ingredient from all lists
            queryClient.setQueriesData({ queryKey: mealPlannerKeys.ingredients() }, (old: any) => {
                if (!old || !Array.isArray(old)) return old
                return old.filter((ingredient: any) => ingredient.id !== id)
            })

            // Optimistically remove the ingredient detail
            queryClient.removeQueries({ queryKey: mealPlannerKeys.ingredientDetail(id) })

            // Return context with snapshots
            return { previousIngredients, previousIngredient }
        },
        onError: (err, id, context) => {
            // Rollback to previous values on error
            if (context?.previousIngredients) {
                context.previousIngredients.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data)
                })
            }
            if (context?.previousIngredient) {
                queryClient.setQueryData(mealPlannerKeys.ingredientDetail(id), context.previousIngredient)
            }
        },
        onSettled: (_, __, id) => {
            // Refetch to ensure data consistency
            queryClient.invalidateQueries({ queryKey: mealPlannerKeys.ingredients() })
            queryClient.removeQueries({ queryKey: mealPlannerKeys.ingredientDetail(id) })
        },
    })
}
