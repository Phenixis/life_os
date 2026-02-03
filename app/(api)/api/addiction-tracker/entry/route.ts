import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { EntryQueries, AddictionQueries } from "@/lib/db/queries/addiction-tracker"

// List entries for an addiction
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const addictionIdParam = searchParams.get('addictionId')
        const limitParam = searchParams.get('limit')
        const offsetParam = searchParams.get('offset')

        if (!addictionIdParam) {
            return NextResponse.json(
                { error: "Missing required query parameter: addictionId" },
                { status: 400 }
            )
        }

        const addictionId = parseInt(addictionIdParam)
        if (isNaN(addictionId)) {
            return NextResponse.json(
                { error: "Invalid addiction ID" },
                { status: 400 }
            )
        }

        const limit = limitParam ? parseInt(limitParam) : 20
        const offset = offsetParam ? parseInt(offsetParam) : 0

        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
            return NextResponse.json(
                { error: "Invalid pagination parameters" },
                { status: 400 }
            )
        }

        // Verify addiction ownership
        const addictionResult = await AddictionQueries.getById(addictionId)
        if ("error" in addictionResult) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        if (addictionResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await EntryQueries.getEntriesForAddiction(addictionId, false, { limit, offset })

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ 
            entries: result.entities,
            total: result.total,
            limit,
            offset,
            hasMore: offset + result.entities.length < result.total,
        })
    } catch (error) {
        console.error('Error fetching entries:', error)
        return NextResponse.json(
            { error: "Failed to fetch entries" },
            { status: 500 }
        )
    }
}

// Create a new journal entry
export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body = await request.json()
        const { addictionId, content } = body

        // Validate required fields
        if (!addictionId || !content) {
            return NextResponse.json(
                { error: "Missing required fields: addictionId, content" },
                { status: 400 }
            )
        }

        // Validate data types
        if (typeof addictionId !== 'number') {
            return NextResponse.json(
                { error: "addictionId must be a number" },
                { status: 400 }
            )
        }

        if (typeof content !== 'string') {
            return NextResponse.json(
                { error: "content must be a string" },
                { status: 400 }
            )
        }

        // Validate content length
        if (content.length > 250) {
            return NextResponse.json(
                { error: "Content must be 250 characters or less" },
                { status: 400 }
            )
        }

        // Verify addiction ownership
        const addictionResult = await AddictionQueries.getById(addictionId)
        if ("error" in addictionResult) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        if (addictionResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await EntryQueries.create({
            user_id: userId,
            addiction_id: addictionId,
            content,
        })

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { entry: result.createdEntity },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating entry:', error)
        return NextResponse.json(
            { error: "Failed to create entry" },
            { status: 500 }
        )
    }
}
