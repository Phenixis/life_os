import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { MealPlannerQueries } from "@/lib/db/queries"

type RouteParams = {
    params: Promise<{
        id: string
    }>
}

/**
 * GET /api/meal/[id]/ingredients
 * Get all ingredients for a specific meal
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

        return NextResponse.json({
            success: "Ingredients retrieved successfully.",
            ingredients: result.meal.ingredients
        })
    } catch (error) {
        console.error("Error fetching meal ingredients:", error)
        return NextResponse.json({ error: "Failed to fetch meal ingredients" }, { status: 500 })
    }
}

/**
 * POST /api/meal/[id]/ingredients
 * Add an ingredient to a meal
 */
export async function POST(
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
        const { ingredient_id, ingredient_name, quantity, unit, description, image_url } = body

        // Verify meal belongs to user
        const mealQuery = new MealPlannerQueries.Meal.MealQuery()
        const meal = await mealQuery.getById(mealId)
        
        if ('error' in meal) {
            return NextResponse.json({ error: "Meal not found" }, { status: 404 })
        }

        if (meal.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        let ingredientId = ingredient_id

        // If ingredient_name is provided instead of ID, find or create it
        if (!ingredientId && ingredient_name) {
            const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()
            const ingredientResult = await ingredientQuery.findOrCreate(
                verification.userId,
                ingredient_name,
                description,
                image_url
            )

            if ('error' in ingredientResult) {
                return NextResponse.json({ error: ingredientResult.error }, { status: 500 })
            }

            ingredientId = ingredientResult.ingredient.id
        }

        if (!ingredientId) {
            return NextResponse.json({ error: "ingredient_id or ingredient_name is required" }, { status: 400 })
        }

        // Add ingredient to meal
        const ingredientToMealQuery = new MealPlannerQueries.IngredientToMeal.IngredientToMealQuery()
        const result = await ingredientToMealQuery.addIngredientToMeal(
            mealId,
            ingredientId,
            quantity || 1,
            unit || "unit"
        )

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error("Error adding ingredient to meal:", error)
        return NextResponse.json({ error: "Failed to add ingredient to meal" }, { status: 500 })
    }
}

/**
 * DELETE /api/meal/[id]/ingredients
 * Remove an ingredient from a meal
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

        const searchParams = request.nextUrl.searchParams
        const ingredientId = searchParams.get("ingredient_id")

        if (!ingredientId) {
            return NextResponse.json({ error: "ingredient_id query parameter is required" }, { status: 400 })
        }

        const ingredientIdNum = Number.parseInt(ingredientId)
        if (isNaN(ingredientIdNum)) {
            return NextResponse.json({ error: "Invalid ingredient ID" }, { status: 400 })
        }

        // Verify meal belongs to user
        const mealQuery = new MealPlannerQueries.Meal.MealQuery()
        const meal = await mealQuery.getById(mealId)
        
        if ('error' in meal) {
            return NextResponse.json({ error: "Meal not found" }, { status: 404 })
        }

        if (meal.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Remove ingredient from meal
        const ingredientToMealQuery = new MealPlannerQueries.IngredientToMeal.IngredientToMealQuery()
        const result = await ingredientToMealQuery.removeIngredientFromMeal(mealId, ingredientIdNum)

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 404 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error removing ingredient from meal:", error)
        return NextResponse.json({ error: "Failed to remove ingredient from meal" }, { status: 500 })
    }
}
