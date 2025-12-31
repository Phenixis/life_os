import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { EntryQueries } from "@/lib/db/queries/addiction-tracker"

// Get a specific entry
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const entryId = parseInt(parameters.id)
        if (isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 }
            )
        }

        const result = await EntryQueries.getById(entryId)

        if ("error" in result) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 }
            )
        }

        // Verify ownership
        if (result.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        return NextResponse.json({ entry: result.entity })
    } catch (error) {
        console.error('Error fetching entry:', error)
        return NextResponse.json(
            { error: "Failed to fetch entry" },
            { status: 500 }
        )
    }
}

// Update an entry
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const entryId = parseInt(parameters.id)
        if (isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { content } = body

        // Validate content
        if (content === undefined) {
            return NextResponse.json(
                { error: "Missing required field: content" },
                { status: 400 }
            )
        }

        if (typeof content !== 'string') {
            return NextResponse.json(
                { error: "content must be a string" },
                { status: 400 }
            )
        }

        if (content.length > 250) {
            return NextResponse.json(
                { error: "Content must be 250 characters or less" },
                { status: 400 }
            )
        }

        // Verify ownership
        const existingResult = await EntryQueries.getById(entryId)
        if ("error" in existingResult) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 }
            )
        }

        if (existingResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await EntryQueries.update(entryId, { content })

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ entry: result.updatedEntity })
    } catch (error) {
        console.error('Error updating entry:', error)
        return NextResponse.json(
            { error: "Failed to update entry" },
            { status: 500 }
        )
    }
}

// Delete an entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const entryId = parseInt(parameters.id)
        if (isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid entry ID" },
                { status: 400 }
            )
        }

        // Verify ownership
        const existingResult = await EntryQueries.getById(entryId)
        if ("error" in existingResult) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 }
            )
        }

        if (existingResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await EntryQueries.delete(entryId)

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: result.success })
    } catch (error) {
        console.error('Error deleting entry:', error)
        return NextResponse.json(
            { error: "Failed to delete entry" },
            { status: 500 }
        )
    }
}
