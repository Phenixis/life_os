import * as Schema from "@/lib/db/schema"

type CreateIngredientData = {
    name: string
    description?: string
    image_url?: string
}

type UpdateIngredientData = {
    name?: string
    description?: string
    image_url?: string
}

export async function createIngredient(apiKey: string, data: CreateIngredientData) {
    const response = await fetch('/api/ingredient', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ingredient')
    }

    return response.json() as Promise<{ success: string; createdEntity: Schema.MealPlanner.Ingredient.Select }>
}

export async function updateIngredient(apiKey: string, ingredientId: number, data: UpdateIngredientData) {
    const response = await fetch(`/api/ingredient/${ingredientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update ingredient')
    }

    return response.json() as Promise<{ success: string; updatedEntity: Schema.MealPlanner.Ingredient.Select }>
}

export async function deleteIngredient(apiKey: string, ingredientId: number) {
    const response = await fetch(`/api/ingredient/${ingredientId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete ingredient')
    }

    return response.json() as Promise<{ success: string }>
}
