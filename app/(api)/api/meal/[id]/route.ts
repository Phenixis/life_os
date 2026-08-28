import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { MealPlannerQueries } from "@/lib/db/queries"

type RouteParams = {
    params: Promise<{
        id: string
    }>
}

/**
 * GET /api/meal/[id]
 * Get a single meal by ID with ingredients
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const mealId = Number.parseInt(id)

        if (isNaN(mealId)) {
            return NextResponse.json({ error: "Invalid meal ID" }, { status: 400 })
        }

        const mealQuery = new MealPlannerQueries.Meal.MealQuery()
        const result = await mealQuery.getByIdWithIngredients(mealId, verification.userId)

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 404 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching meal:", error)
        return NextResponse.json({ error: "Failed to fetch meal" }, { status: 500 })
    }
}

/**
 * PUT /api/meal/[id]
 * Update a meal
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const mealId = Number.parseInt(id)

        if (isNaN(mealId)) {
            return NextResponse.json({ error: "Invalid meal ID" }, { status: 400 })
        }

        const body = await request.json()
        const { name, description, image_url, ingredients } = body

        const mealQuery = new MealPlannerQueries.Meal.MealQuery()

        // Verify meal belongs to user
        const existingMeal = await mealQuery.getById(mealId)
        if ('error' in existingMeal) {
            return NextResponse.json({ error: "Meal not found" }, { status: 404 })
        }

        if (existingMeal.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Update meal
        const updateData: any = {}
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (image_url !== undefined) updateData.image_url = image_url || null

        if (Object.keys(updateData).length > 0) {
            const result = await mealQuery.update(mealId, updateData)
            if ('error' in result) {
                return NextResponse.json({ error: result.error }, { status: 500 })
            }
        }

        // Update ingredients if provided
        if (ingredients && Array.isArray(ingredients)) {
            const ingredientToMealQuery = new MealPlannerQueries.IngredientToMeal.IngredientToMealQuery()
            const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()

            const ingredientsToSet = []
            for (const ingredient of ingredients) {
                // Find or create ingredient
                const ingredientResult = await ingredientQuery.findOrCreate(
                    verification.userId,
                    ingredient.name,
                    ingredient.description,
                    ingredient.image_url
                )

                if ('error' in ingredientResult) {
                    console.error("Error creating ingredient:", ingredientResult.error)
                    continue
                }

                ingredientsToSet.push({
                    ingredientId: ingredientResult.ingredient.id,
                    quantity: ingredient.quantity || 1,
                    unit: ingredient.unit || "unit"
                })
            }

            await ingredientToMealQuery.setMealIngredients(mealId, ingredientsToSet)
        }

        // Return updated meal with ingredients
        const updatedMeal = await mealQuery.getByIdWithIngredients(mealId, verification.userId)
        if ('error' in updatedMeal) {
            return NextResponse.json({ error: "Failed to fetch updated meal" }, { status: 500 })
        }

        return NextResponse.json({
            success: "Meal updated successfully.",
            updatedEntity: updatedMeal.meal
        })
    } catch (error) {
        console.error("Error updating meal:", error)
        return NextResponse.json({ error: "Failed to update meal" }, { status: 500 })
    }
}

/**
 * DELETE /api/meal/[id]
 * Soft delete a meal and its unsaved ingredients
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const mealId = Number.parseInt(id)

        if (isNaN(mealId)) {
            return NextResponse.json({ error: "Invalid meal ID" }, { status: 400 })
        }

        const mealQuery = new MealPlannerQueries.Meal.MealQuery()

        // Verify meal belongs to user
        const existingMeal = await mealQuery.getById(mealId)
        if ('error' in existingMeal) {
            return NextResponse.json({ error: "Meal not found" }, { status: 404 })
        }

        if (existingMeal.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Delete ingredients that are not saved in list maker
        const ingredientToMealQuery = new MealPlannerQueries.IngredientToMeal.IngredientToMealQuery()
        await ingredientToMealQuery.deleteUnsavedIngredientsForMeal(mealId)

        // Delete the meal
        const result = await mealQuery.delete(mealId)

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error deleting meal:", error)
        return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 })
    }
}
