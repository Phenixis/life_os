import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { MealPlannerQueries } from "@/lib/db/queries"

/**
 * GET /api/meal
 * Get all meals for the authenticated user with optional filtering
 */
export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get("searchQuery") || undefined
    const orderBy = (searchParams.get("orderBy") as "created_at" | "updated_at" | "name") || "created_at"
    const orderingDirection = (searchParams.get("orderingDirection") as "asc" | "desc") || "desc"
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 50
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset") as string) : 0
    const withIngredients = searchParams.get("withIngredients") === "true"

    try {
        const mealQuery = new MealPlannerQueries.Meal.MealQuery()
        
        let result
        if (withIngredients) {
            result = await mealQuery.getAllWithIngredients(verification.userId, {
                searchQuery,
                orderBy,
                orderingDirection,
                limit,
                offset
            })
        } else {
            result = await mealQuery.getByUserId(verification.userId, {
                searchQuery,
                orderBy,
                orderingDirection,
                limit,
                offset
            })
        }

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 404 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching meals:", error)
        return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 })
    }
}

/**
 * POST /api/meal
 * Create a new meal
 */
export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { name, description, image_url, ingredients } = body

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const mealQuery = new MealPlannerQueries.Meal.MealQuery()
        const result = await mealQuery.create({
            user_id: verification.userId,
            name: name.trim(),
            description: description?.trim() || null,
            image_url: image_url || null
        })

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        // Add ingredients if provided
        if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
            const ingredientToMealQuery = new MealPlannerQueries.IngredientToMeal.IngredientToMealQuery()
            const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()

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

                // Add to meal
                await ingredientToMealQuery.addIngredientToMeal(
                    result.createdEntity.id,
                    ingredientResult.ingredient.id,
                    ingredient.quantity || 1,
                    ingredient.unit || "unit"
                )
            }

            // Return meal with ingredients
            const mealWithIngredients = await mealQuery.getByIdWithIngredients(
                result.createdEntity.id,
                verification.userId
            )

            if ('error' in mealWithIngredients) {
                return NextResponse.json(result, { status: 201 })
            }

            return NextResponse.json({
                success: result.success,
                createdEntity: mealWithIngredients.meal
            }, { status: 201 })
        }

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error("Error creating meal:", error)
        return NextResponse.json({ error: "Failed to create meal" }, { status: 500 })
    }
}
