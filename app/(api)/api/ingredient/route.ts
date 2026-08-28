import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { MealPlannerQueries } from "@/lib/db/queries"

/**
 * GET /api/ingredient
 * Get all ingredients for the authenticated user with optional filtering
 */
export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get("searchQuery") || undefined
    const orderBy = (searchParams.get("orderBy") as "created_at" | "updated_at" | "name") || "name"
    const orderingDirection = (searchParams.get("orderingDirection") as "asc" | "desc") || "asc"
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 100
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset") as string) : 0

    try {
        const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()
        const result = await ingredientQuery.getByUserId(verification.userId, {
            searchQuery,
            orderBy,
            orderingDirection,
            limit,
            offset
        })

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 404 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching ingredients:", error)
        return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 })
    }
}

/**
 * POST /api/ingredient
 * Create a new ingredient
 */
export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { name, description, image_url } = body

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()
        
        // Use findOrCreate to avoid duplicates
        const result = await ingredientQuery.findOrCreate(
            verification.userId,
            name.trim(),
            description?.trim(),
            image_url
        )

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        if (result.created) {
            return NextResponse.json({
                success: "Ingredient created successfully.",
                createdEntity: result.ingredient
            }, { status: 201 })
        } else {
            return NextResponse.json({
                success: "Ingredient already exists.",
                createdEntity: result.ingredient
            }, { status: 200 })
        }
    } catch (error) {
        console.error("Error creating ingredient:", error)
        return NextResponse.json({ error: "Failed to create ingredient" }, { status: 500 })
    }
}
