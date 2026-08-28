import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { MealPlannerQueries } from "@/lib/db/queries"

type RouteParams = {
    params: Promise<{
        id: string
    }>
}

/**
 * GET /api/ingredient/[id]
 * Get a single ingredient by ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const ingredientId = Number.parseInt(id)

        if (isNaN(ingredientId)) {
            return NextResponse.json({ error: "Invalid ingredient ID" }, { status: 400 })
        }

        const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()
        const result = await ingredientQuery.getById(ingredientId)

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 404 })
        }

        // Verify ingredient belongs to user
        if (result.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching ingredient:", error)
        return NextResponse.json({ error: "Failed to fetch ingredient" }, { status: 500 })
    }
}

/**
 * PUT /api/ingredient/[id]
 * Update an ingredient
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const ingredientId = Number.parseInt(id)

        if (isNaN(ingredientId)) {
            return NextResponse.json({ error: "Invalid ingredient ID" }, { status: 400 })
        }

        const body = await request.json()
        const { name, description, image_url } = body

        const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()

        // Verify ingredient belongs to user
        const existingIngredient = await ingredientQuery.getById(ingredientId)
        if ('error' in existingIngredient) {
            return NextResponse.json({ error: "Ingredient not found" }, { status: 404 })
        }

        if (existingIngredient.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Update ingredient
        const updateData: any = {}
        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (image_url !== undefined) updateData.image_url = image_url || null

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 })
        }

        const result = await ingredientQuery.update(ingredientId, updateData)

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error updating ingredient:", error)
        return NextResponse.json({ error: "Failed to update ingredient" }, { status: 500 })
    }
}

/**
 * DELETE /api/ingredient/[id]
 * Soft delete an ingredient
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const ingredientId = Number.parseInt(id)

        if (isNaN(ingredientId)) {
            return NextResponse.json({ error: "Invalid ingredient ID" }, { status: 400 })
        }

        const ingredientQuery = new MealPlannerQueries.Ingredient.IngredientQuery()

        // Verify ingredient belongs to user
        const existingIngredient = await ingredientQuery.getById(ingredientId)
        if ('error' in existingIngredient) {
            return NextResponse.json({ error: "Ingredient not found" }, { status: 404 })
        }

        if (existingIngredient.entity.user_id !== verification.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const result = await ingredientQuery.delete(ingredientId)

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error deleting ingredient:", error)
        return NextResponse.json({ error: "Failed to delete ingredient" }, { status: 500 })
    }
}
