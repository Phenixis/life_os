import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { AddictionQueries } from "@/lib/db/queries/addiction-tracker"

// Get a specific addiction
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const addictionId = parseInt(parameters.id)
        if (isNaN(addictionId)) {
            return NextResponse.json(
                { error: "Invalid addiction ID" },
                { status: 400 }
            )
        }

        const result = await AddictionQueries.getByIds([addictionId])

        if ("error" in result) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        const addiction = result.entities[0]

        // Verify ownership
        if (addiction.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        return NextResponse.json({ addiction })
    } catch (error) {
        console.error('Error fetching addiction:', error)
        return NextResponse.json(
            { error: "Failed to fetch addiction" },
            { status: 500 }
        )
    }
}

// Update an addiction
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const addictionId = parseInt(parameters.id)
        if (isNaN(addictionId)) {
            return NextResponse.json(
                { error: "Invalid addiction ID" },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { title, description } = body

        // Validate that at least one field is provided
        if (title === undefined && description === undefined) {
            return NextResponse.json(
                { error: "At least one field (title or description) must be provided" },
                { status: 400 }
            )
        }

        // Validate data types
        if (title !== undefined && typeof title !== 'string') {
            return NextResponse.json(
                { error: "Title must be a string" },
                { status: 400 }
            )
        }

        if (description !== undefined && description !== null && typeof description !== 'string') {
            return NextResponse.json(
                { error: "Description must be a string or null" },
                { status: 400 }
            )
        }

        // Validate title length
        if (title && title.length > 255) {
            return NextResponse.json(
                { error: "Title must be 255 characters or less" },
                { status: 400 }
            )
        }

        // Validate description length
        if (description && description.length > 1000) {
            return NextResponse.json(
                { error: "Description must be 1000 characters or less" },
                { status: 400 }
            )
        }

        // Verify ownership
        const existingResult = await AddictionQueries.getById(addictionId)
        if ("error" in existingResult) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        if (existingResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        // Build update object
        const updateData: { title?: string; description?: string | null } = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description

        const result = await AddictionQueries.update(addictionId, updateData)

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        // Fetch updated addiction with stats
        const addictionResult = await AddictionQueries.getByIds([addictionId])

        if ("error" in addictionResult) {
            return NextResponse.json({ addiction: result.updatedEntity })
        }

        return NextResponse.json({ addiction: addictionResult.entities[0] })
    } catch (error) {
        console.error('Error updating addiction:', error)
        return NextResponse.json(
            { error: "Failed to update addiction" },
            { status: 500 }
        )
    }
}

// Delete an addiction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const addictionId = parseInt(parameters.id)
        if (isNaN(addictionId)) {
            return NextResponse.json(
                { error: "Invalid addiction ID" },
                { status: 400 }
            )
        }

        // Verify ownership
        const existingResult = await AddictionQueries.getById(addictionId)
        if ("error" in existingResult) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        if (existingResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await AddictionQueries.delete(addictionId)

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: result.success })
    } catch (error) {
        console.error('Error deleting addiction:', error)
        return NextResponse.json(
            { error: "Failed to delete addiction" },
            { status: 500 }
        )
    }
}
