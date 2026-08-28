import type { MealWithIngredients } from "@/lib/db/queries/meal-planner/meal"

type CreateMealData = {
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

type UpdateMealData = {
    name?: string
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

export async function createMeal(apiKey: string, data: CreateMealData) {
    const response = await fetch('/api/meal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create meal')
    }

    return response.json() as Promise<{ success: string; createdEntity: MealWithIngredients }>
}

export async function updateMeal(apiKey: string, mealId: number, data: UpdateMealData) {
    const response = await fetch(`/api/meal/${mealId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update meal')
    }

    return response.json() as Promise<{ success: string; updatedEntity: MealWithIngredients }>
}

export async function deleteMeal(apiKey: string, mealId: number) {
    const response = await fetch(`/api/meal/${mealId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete meal')
    }

    return response.json() as Promise<{ success: string }>
}

export async function addIngredientToMeal(
    apiKey: string,
    mealId: number,
    data: {
        ingredient_id?: number
        ingredient_name?: string
        quantity?: number
        unit?: string
        description?: string
        image_url?: string
    }
) {
    const response = await fetch(`/api/meal/${mealId}/ingredients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add ingredient to meal')
    }

    return response.json()
}

export async function removeIngredientFromMeal(
    apiKey: string,
    mealId: number,
    ingredientId: number
) {
    const response = await fetch(`/api/meal/${mealId}/ingredients?ingredient_id=${ingredientId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove ingredient from meal')
    }

    return response.json() as Promise<{ success: string }>
}
